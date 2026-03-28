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
  is_available?: boolean;
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

export default function ProductMobile() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);

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

  // ✅ NEW: Helper to calculate mathematical weight in KG
  const getWeightInKg = (unitStr: string | undefined, qty: number) => {
    if (!unitStr) return 0.5 * qty; // Default to 500g if no unit is set
    
    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/);
    const unitValue = match ? parseFloat(match[0]) : 1;

    if (unit.includes("kg")) return unitValue * qty;
    if (unit.includes("g") && !unit.includes("k")) return (unitValue / 1000) * qty;
    
    // For "pc", "packet", "piece" -> Assume 500g (0.5kg)
    return 0.5 * qty; 
  };

  // ✅ NEW: Calculate the total weight of the ENTIRE cart
  const getCurrentCartWeight = (currentCart: CartItem[]) => {
    return currentCart.reduce((total, item) => total + getWeightInKg(item.unit, item.quantity), 0);
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
    
    // ✅ GATEKEEPER: Check 5kg limit before adding!
    const currentTotalWeight = getCurrentCartWeight(currentCart);
    const weightToAdd = getWeightInKg(product.unit, qty);

    if (currentTotalWeight + weightToAdd > 5.0) {
      triggerPopup(`Limit Exceeded! Cart has ${currentTotalWeight.toFixed(1)}kg. Max is 5kg.`);
      return; // 🛑 Block the addition!
    }

    // Normal Add to Cart logic resumes below
    const existingProductIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex > -1) {
      currentCart[existingProductIndex].quantity += qty;
    } else {
      currentCart.push({ 
        id: product.id, 
        name: product.name, 
        slug: product.slug, 
        price: product.price, 
        image: product.image, 
        quantity: qty, 
        unit: product.unit 
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, items: currentCart.map((i) => ({ product_id: i.id, quantity: i.quantity })) }),
        });
      } catch (error) { 
        console.error("Cart sync failed:", error); 
      }
    }
    
    setQty(1);
    triggerPopup("Added to cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#00b8d9]" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Product not found</h2>
          <Link href="/" className="text-[#00b8d9] font-bold text-sm">Go back home</Link>
        </div>
      </div>
    );
  }

  const totalPrice = (product.price * qty).toFixed(2);
  const totalWeightStr = calculateTotalWeight(qty, product.unit);
  const galleryImages = (product.images && product.images.length > 0) ? product.images : product.image ? [product.image] : [];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-44 relative">

      {/* Toast */}
      {/* Toast — only rendered when triggered */}
      {popupMessage && (
        <div className={`fixed bottom-36 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 ease-out ${showPopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
          <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2.5">
            <div className={`${popupMessage.includes('Added') ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full p-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {popupMessage.includes('Added') ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18" />}
              </svg>
            </div>
            <span className="text-xs font-medium text-white whitespace-nowrap">{popupMessage}</span>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-slate-900 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <span className="font-semibold text-sm">Product Details</span>
        <div className="w-10"></div>
      </div>

      {/* Image Slider */}
      <div className={`relative ${product.is_available === false ? 'grayscale opacity-70' : ''}`}>
        <button onClick={toggleWishlist} disabled={wishlistLoading} className="absolute top-4 right-8 z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist ? "#10b981" : "none"} stroke={isInWishlist ? "#10b981" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21Z"/></svg>
        </button>

        {/* ✅ NEW: The Stockout Badge */}
        {product.is_available === false && (
          <div className="absolute top-4 left-6 bg-gray-900/90 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded uppercase tracking-widest backdrop-blur-sm z-10 shadow-lg">
            Out of Stock
          </div>
        )}

        <div className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-50 relative mx-4 mt-4 rounded-3xl overflow-hidden border border-slate-100"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setMobileActiveIndex(Math.round(target.scrollLeft / target.offsetWidth));
          }}>
          {galleryImages.map((img, index) => (
            <div key={index} className="w-full flex-shrink-0 snap-center aspect-square">
              <img src={`http://localhost:8000${img}`} alt={`${product.name} ${index}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {galleryImages.length === 0 && (
            <div className="w-full flex-shrink-0 aspect-square flex items-center justify-center text-slate-300 font-bold">No Image</div>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none z-10">
            {galleryImages.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${mobileActiveIndex === i ? 'w-6 bg-[#00b8d9]' : 'w-2 bg-slate-300/80'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-5 space-y-4">
        {product.category && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#00b8d9] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100 inline-block">{product.category}</span>
        )}

        <h1 className="text-xl font-bold text-slate-900 leading-tight">{product.name}</h1>

        {product.unit && <p className="text-emerald-600 font-semibold text-xs">Net Quantity: {product.unit}</p>}

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
          {product.compare_price && <span className="text-sm text-slate-400 line-through font-medium">₹{product.compare_price.toFixed(2)}</span>}
        </div>

        {product.description && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Description</h4>
            <p className="text-slate-600 text-xs leading-relaxed font-medium">{product.description}</p>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="bg-cyan-50 p-3.5 rounded-xl border border-cyan-100">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#00b8d9] mb-1">Storage Instructions</h4>
            <p className="text-cyan-800 text-[11px] font-medium leading-relaxed">Store under refrigeration at 0°C to 4°C. Consume within 24 hours of opening. Do not refreeze after thawing.</p>
          </div>
          <div className="text-[9px] text-slate-400 uppercase font-semibold tracking-tight">
            Marketed By: <span className="font-medium capitalize">Fresh & Safe Foods Pvt Ltd, Kerala</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Add to Cart — above MobileNavbar */}
      {/* Sticky Bottom Add to Cart — above MobileNavbar */}
      <div className="fixed bottom-20 left-0 right-0 z-[45] px-4 pb-3 flex items-center gap-3">
        
        {/* ✅ UPDATED: Disable the + / - buttons if out of stock */}
        <div className={`flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-11 flex-shrink-0 ${product.is_available === false ? 'opacity-50 pointer-events-none' : ''}`}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-full flex items-center justify-center text-[#00b8d9] font-bold text-lg">-</button>
          <span className="w-8 text-center font-bold text-sm">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-10 h-full flex items-center justify-center text-[#00b8d9] font-bold text-lg">+</button>
        </div>

        {/* ✅ UPDATED: Disable the Add to Cart button entirely */}
        <button 
          onClick={handleAddToCart} 
          disabled={product.is_available === false}
          className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
            product.is_available === false 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-[#00b8d9] text-white hover:opacity-90'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          
          {product.is_available === false ? 'Out of Stock' : `Add to Cart | ₹${totalPrice}`}
        </button>
      </div>
    </div>
  );
}