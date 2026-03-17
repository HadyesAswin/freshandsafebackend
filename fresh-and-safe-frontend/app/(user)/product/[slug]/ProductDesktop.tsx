'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  images?: string[];
  price: number;
  compare_price?: number | null;
  unit?: string;
  category?: string;
}

interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string;
}

export default function ProductDesktop() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const calculateTotalWeight = (quantity: number, unitStr: string | undefined) => {
    if (!unitStr) return "";
    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/);
    const unitValue = match ? parseFloat(match[0]) : 1;
    if (unit.includes("g") && !unit.includes("k")) {
      const totalG = quantity * unitValue;
      return totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
    }
    if (unit.includes("kg")) return `${(quantity * unitValue).toFixed(1)}kg`;
    if (unit.includes("pc") || unit.includes("piece")) return `${quantity * unitValue} Pieces`;
    return `${quantity * unitValue} ${unitStr}`;
  };

  const triggerPopup = (message: string) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) { router.push("/"); return; }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/location-products/product/${slug}?zipcode=${storedZip}`);
        if (!res.ok) { router.push("/"); return; }
        const data = await res.json();
        setProduct(data);

        if (data.images && data.images.length > 0) setActiveImage(data.images[0]);
        else if (data.image) setActiveImage(data.image);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const wishRes = await fetch(`http://localhost:8000/api/v1/wishlist/${user.id}`);
          if (wishRes.ok) {
            const wishlistItems = await wishRes.json();
            setIsInWishlist(wishlistItems.some((item: any) => item.id === data.id));
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, router]);

  const toggleWishlist = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { triggerPopup("Please login to manage wishlist"); return; }
    if (!product) return;

    setWishlistLoading(true);
    const user = JSON.parse(storedUser);

    try {
      const currentRes = await fetch(`http://localhost:8000/api/v1/wishlist/${user.id}`);
      let productIds: number[] = [];
      if (currentRes.ok) {
        const currentItems = await currentRes.json();
        productIds = currentItems.map((item: any) => item.id);
      }

      if (isInWishlist) productIds = productIds.filter(id => id !== product.id);
      else if (!productIds.includes(product.id)) productIds.push(product.id);

      const syncRes = await fetch(`http://localhost:8000/api/v1/wishlist/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, product_ids: productIds }),
      });

      if (syncRes.ok) {
        const newState = !isInWishlist;
        setIsInWishlist(newState);
        const wishRes = await fetch(`http://localhost:8000/api/v1/wishlist/${user.id}`);
        if (wishRes.ok) {
          const updatedWishlist = await wishRes.json();
          localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
        }
        triggerPopup(newState ? "Added to wishlist" : "Removed from wishlist");
      }
    } catch (error) { console.error("Wishlist sync error:", error); }
    finally { setWishlistLoading(false); }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const existingCart = localStorage.getItem("cart");
    let currentCart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];
    const existingProductIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex > -1) currentCart[existingProductIndex].quantity += qty;
    else currentCart.push({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image, quantity: qty, unit: product.unit });

    localStorage.setItem("cart", JSON.stringify(currentCart));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, items: currentCart.map((i) => ({ product_id: i.id, quantity: i.quantity })) }),
        });
      } catch (error) { console.error("Cart sync failed:", error); }
    }
    setQty(1);
    triggerPopup("Added to cart");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#00b8d9]" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Product...</span>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Product not found</h2>
          <Link href="/" className="text-[#00b8d9] font-bold text-sm">Go back home</Link>
        </div>
      </main>
    );
  }

  const totalPrice = (product.price * qty).toFixed(2);
  const totalWeightStr = calculateTotalWeight(qty, product.unit);
  const galleryImages = (product.images && product.images.length > 0) ? product.images : product.image ? [product.image] : [];

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-10 relative">

      {/* Toast Popup — only rendered when triggered */}
      {popupMessage && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${showPopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
          <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className={`${popupMessage.includes('Added') ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full p-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {popupMessage.includes('Added') ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18" />}
              </svg>
            </div>
            <span className="text-sm font-medium text-white whitespace-nowrap">{popupMessage}</span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* LEFT: Desktop Vertical Gallery */}
          <div className="w-full space-y-4">
            <div className="grid grid-cols-[4rem_1fr] lg:grid-cols-[5rem_1fr] gap-4">
              <div className="relative h-full">
                <div className="absolute inset-0 flex flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                  {galleryImages.map((img, index) => (
                    <button key={index} onClick={() => setActiveImage(img)}
                      className={`relative w-full shrink-0 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all duration-200 ${activeImage === img ? 'border-[#00b8d9] opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-200'}`}>
                      <img src={`http://localhost:8000${img}`} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden group aspect-square">
                <button onClick={toggleWishlist} disabled={wishlistLoading} className="absolute top-4 right-4 z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist ? "#10b981" : "none"} stroke={isInWishlist ? "#10b981" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21Z"/></svg>
                </button>
                {activeImage ? (
                  <img src={`http://localhost:8000${activeImage}`} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">No Image</div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="flex flex-col space-y-6 w-full pt-2 lg:pl-4">
            <div className="max-w-[480px]">
              {product.category && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00b8d9] bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100 inline-block mb-4">{product.category}</span>
              )}

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">{product.name}</h1>

              {product.unit && <p className="text-emerald-600 font-semibold text-sm">Net Quantity: {product.unit}</p>}

              <div className="flex items-center gap-3 mt-4">
                <span className="text-3xl font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
                {product.compare_price && <span className="text-lg text-slate-400 line-through font-medium">₹{product.compare_price.toFixed(2)}</span>}
              </div>

              <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-12">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-full flex items-center justify-center text-[#00b8d9] font-bold text-xl hover:bg-slate-50 transition-colors">-</button>
                    <span className="w-10 text-center font-bold text-lg">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="w-12 h-full flex items-center justify-center text-[#00b8d9] font-bold text-xl hover:bg-slate-50 transition-colors">+</button>
                  </div>
                  <div className="text-right">
                    {totalWeightStr && <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">{totalWeightStr} Total</span>}
                  </div>
                </div>

                <button onClick={handleAddToCart} className="w-full bg-[#00b8d9] hover:bg-[#00a2bf] text-white h-14 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  Add to Cart <span className="opacity-40 font-normal">|</span> ₹{totalPrice}
                </button>
              </div>

              {product.description && (
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Description</h4>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{product.description}</p>
                </div>
              )}

              <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#00b8d9] mb-1">Storage Instructions</h4>
                  <p className="text-cyan-800 text-xs font-medium leading-relaxed">Store under refrigeration at 0°C to 4°C. Consume within 24 hours of opening. Do not refreeze after thawing.</p>
                </div>
                <div className="pt-2 text-[10px] text-slate-400 leading-relaxed uppercase font-semibold tracking-tight">
                  Marketed By: <span className="font-medium capitalize">Fresh & Safe Foods Pvt Ltd, Kerala</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}