"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, ShoppingBasket, Heart } from "lucide-react"; 

interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  images?: string[]; // ✅ Added support for multiple images
  price: number;
  compare_price?: number | null; // ✅ Changed from original_price
  unit?: string;
  category?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string; 
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showCartModal, setShowCartModal] = useState(false);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ✅ NEW: State for currently viewed image in the gallery
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const calculateTotalWeight = (qty: number, unitStr: string | undefined) => {
    if (!unitStr) return "";
    
    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/); 
    const unitValue = match ? parseFloat(match[0]) : 1;

    if (unit.includes("g") && !unit.includes("k")) {
      const totalG = qty * unitValue;
      return totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
    }

    if (unit.includes("kg")) {
      return `${(qty * unitValue).toFixed(1)}kg`;
    }

    if (unit.includes("pc") || unit.includes("piece")) {
      return `${qty * unitValue} Pieces`;
    }

    return `${qty * unitValue} ${unitStr}`;
  };

  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) {
      router.push("/");
      return;
    }
    setZipcode(storedZip);

    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/location-products/product/${slug}?zipcode=${storedZip}`
        );
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setProduct(data);
        
        // ✅ Set the initial active image (either the first from array or the primary image)
        if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0]);
        } else if (data.image) {
            setActiveImage(data.image);
        }
        
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
    if (!storedUser) {
      alert("Please login to manage your wishlist");
      return;
    }
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

      if (isInWishlist) {
        productIds = productIds.filter(id => id !== product.id);
      } else {
        if (!productIds.includes(product.id)) {
          productIds.push(product.id);
        }
      }

      const syncRes = await fetch(`http://localhost:8000/api/v1/wishlist/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_ids: productIds,
        }),
      });

      if (syncRes.ok) {
        setIsInWishlist(!isInWishlist);
      } else {
        alert("Failed to update wishlist");
      }
    } catch (error) {
      console.error("Wishlist sync error:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const existingCart = localStorage.getItem("cart");
    let currentCart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];
    const existingProductIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex > -1) {
      currentCart[existingProductIndex].quantity += quantity;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        unit: product.unit,
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
          body: JSON.stringify({
            user_id: user.id,
            items: currentCart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          }),
        });
      } catch (error) {
        console.error("Database sync failed:", error);
      }
    }
    setQuantity(1);
    setShowCartModal(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500 font-bold">Loading...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center text-gray-500 font-bold">Not found.</div>;

  const sellingPrice = product.price;
  const totalPrice = (sellingPrice * quantity).toFixed(2);
  const totalWeightStr = calculateTotalWeight(quantity, product.unit);

  // ✅ Normalize images array for rendering
  const galleryImages = (product.images && product.images.length > 0) 
      ? product.images 
      : product.image ? [product.image] : [];

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          {zipcode && <div className="bg-gray-100 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest">📍 {zipcode}</div>}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
        
        {/* ✅ UPDATED: Left Side Media Gallery */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-8 shadow-sm border flex items-center justify-center relative h-[450px]">
            <button 
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className="absolute top-6 right-6 p-3 rounded-full bg-white shadow-lg border border-gray-100 transition-all active:scale-90 hover:bg-gray-50 z-10"
            >
              <Heart className={`w-6 h-6 transition-colors ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
            </button>

            {activeImage ? (
              <img src={`http://localhost:8000${activeImage}`} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <div className="flex items-center justify-center text-gray-300 font-bold uppercase">No Image</div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((imgUrl, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(imgUrl)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden bg-white transition-all ${activeImage === imgUrl ? 'border-green-600 shadow-md ring-2 ring-green-100' : 'border-gray-200 hover:border-green-300 opacity-60 hover:opacity-100'}`}
                >
                  <img src={`http://localhost:8000${imgUrl}`} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover mix-blend-multiply p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          {product.category && <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-widest border border-green-100">{product.category}</span>}

          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 leading-tight">{product.name}</h1>

          {product.description && <p className="text-gray-500 text-lg mb-8 leading-relaxed">{product.description}</p>}

          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-green-700">₹{sellingPrice}</span>
              {/* ✅ Render the standard compare_price as crossed out */}
              {product.compare_price && <span className="text-xl text-gray-400 line-through">₹{product.compare_price}</span>}
              {product.unit && <span className="text-xl font-bold text-gray-400">/ {product.unit}</span>}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-wider">Inclusive of all taxes</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 px-6 py-2 rounded-bl-2xl shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-tighter text-yellow-900 leading-none mb-1">Total Quantity</p>
                <p className="text-xl font-black text-slate-900 leading-none">{totalWeightStr}</p>
            </div>

            <div className="flex items-center justify-between mb-8 mt-4">
              <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                <button onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className="px-6 py-4 hover:bg-white text-2xl font-black transition-colors">-</button>
                <div className="px-8 py-4 font-black text-2xl w-20 text-center text-slate-800">{quantity}</div>
                <button onClick={() => setQuantity((prev) => prev + 1)} className="px-6 py-4 hover:bg-white text-2xl font-black transition-colors">+</button>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Final Subtotal</p>
                <p className="text-3xl font-black text-slate-800">₹{totalPrice}</p>
              </div>
            </div>

            <button onClick={handleAddToCart} className="w-full py-5 bg-green-600 text-white font-black text-xl rounded-2xl hover:bg-green-700 active:scale-95 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3">
              <ShoppingBasket className="w-6 h-6" /> Add {totalWeightStr} to Cart
            </button>
          </div>
        </div>
      </div>

      {showCartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-10 w-full max-w-sm shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Added to Cart!</h2>
            <p className="text-gray-500 mb-8 font-medium">You selected {totalWeightStr} of {product.name}.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push("/cart")} className="py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg">Go to Cart</button>
              <button onClick={() => setShowCartModal(false)} className="py-3 bg-white text-gray-500 font-bold rounded-xl border">Keep Shopping</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}