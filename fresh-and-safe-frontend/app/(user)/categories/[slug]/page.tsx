'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from "next/navigation";

// 1. Define Interface mapping to your backend Product data
interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image?: string;
  unit?: string;
  category_name?: string;
}

// 2. SUB-COMPONENTS
const SkeletonCard = ({ isSingleColumn }: { isSingleColumn: boolean }) => (
  <div className="bg-white p-5 relative animate-pulse border border-slate-100 rounded-2xl">
    <div
      className={`overflow-hidden rounded-xl bg-slate-200 mb-5 ${
        isSingleColumn ? 'aspect-[16/9]' : 'aspect-square'
      }`}
    />
    <div className="space-y-2">
      <div className="h-3 w-1/3 bg-slate-200 rounded" />
      <div className="h-4 w-full bg-slate-200 rounded" />
      <div className="h-4 w-5/6 bg-slate-200 rounded" />
      <div className="flex items-baseline gap-2 mt-4">
        <div className="h-6 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-12 bg-slate-200 rounded" />
      </div>
    </div>
  </div>
);

export default function CategoryProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // UI States
  const [isSingleColumn, setIsSingleColumn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [zipcode, setZipcode] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // 3. Fetch Data & Wishlist Sync Logic
  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) {
      router.push("/");
      return;
    }
    setZipcode(storedZip);

    // Instantly load local wishlist for fast UI
    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    // If User is logged in, fetch their true wishlist from the Database
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      fetch(`http://localhost:8000/api/v1/wishlist/${user.id}`)
        .then(res => res.json())
        .then(dbWishlist => {
          setWishlist(dbWishlist);
          localStorage.setItem("wishlist", JSON.stringify(dbWishlist)); // Keep local in sync
        })
        .catch(err => console.error("Failed to fetch DB wishlist", err));
    }

    // Fetch Category Products
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/location-products/category/${slug}?zipcode=${storedZip}`);
        if (res.ok) {
          const data = await res.json();
          setCategoryName(data.category_name || slug);
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Error loading category:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  // Hybrid Toggle Logic with Toast Popup
  const toggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setPopupMessage("Please login to use wishlist");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return; // Stop execution here if not logged in
    }

    let updatedWishlist;
    const isLoved = wishlist.some((item) => item.id === product.id);
    
    // Optimistic UI Update & Toast Message
    if (isLoved) {
      updatedWishlist = wishlist.filter((item) => item.id !== product.id);
      setPopupMessage("Product removed from wishlist");
    } else {
      updatedWishlist = [...wishlist, product];
      setPopupMessage("Product added to wishlist");
    }
    
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    
    // Show Toast
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 2000);

    // Sync to Database
    const user = JSON.parse(storedUser);
    try {
      await fetch("http://localhost:8000/api/v1/wishlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_ids: updatedWishlist.map(item => item.id)
        })
      });
    } catch (error) {
      console.error("Wishlist sync failed", error);
    }
  };

  // Helper to format units nicely
  const formatUnit = (unit?: string) => {
    if (!unit) return "";
    
    // Normalize the string (make it uppercase and remove extra spaces)
    const normalized = unit.trim().toUpperCase();
    
    // If it equals exactly "KG", "1KG", or "1 KG", format it
    if (normalized === "KG" || normalized === "1KG" || normalized === "1 KG") {
      return "1 Kilo Gram";
    }
    
    // Otherwise, just return what came from the database (e.g., "500g")
    return unit;
  };

  // Helper to split title (e.g. "Marine Fish" -> "Marine" in black, "Fish" in cyan)
  const formatTitle = (name: string) => {
    if (!name) return { first: "", last: "" };
    const words = name.split(" ");
    if (words.length === 1) return { first: words[0], last: "" };
    const last = words.pop();
    const first = words.join(" ");
    return { first, last };
  };
  const { first: titleFirst, last: titleLast } = formatTitle(categoryName);

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-cyan-100 relative">
      
      {/* Toast Popup */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          showPopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className={`${popupMessage.includes('added') ? 'bg-emerald-500' : (popupMessage.includes('login') ? 'bg-amber-500' : 'bg-rose-500')} rounded-full p-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {popupMessage.includes('added') ? <polyline points="20 6 9 17 4 12"/> : (popupMessage.includes('login') ? <circle cx="12" cy="12" r="10" /> : <line x1="18" y1="6" x2="6" y2="18" />)}
            </svg>
          </div>
          <span className="text-sm font-medium text-white whitespace-nowrap">{popupMessage}</span>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-10">
        <div className="relative flex items-center justify-center mb-6 border-b border-slate-100 pb-4">
          
          {/* Optional Back Button for Mobile Alignment */}
          <button onClick={() => router.back()} className="absolute left-0 p-2 text-slate-400 md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 capitalize">
            {titleFirst} {titleLast && <span className="text-[#00b8d9]">{titleLast}</span>}
          </h1>

          <div className="absolute right-0 flex md:hidden bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setIsSingleColumn(true)} 
                className={`p-1.5 rounded-md transition-colors ${isSingleColumn ? 'bg-white text-[#00b8d9]' : 'text-slate-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
            </button>
            <button 
                onClick={() => setIsSingleColumn(false)} 
                className={`p-1.5 rounded-md transition-colors ${!isSingleColumn ? 'bg-white text-[#00b8d9]' : 'text-slate-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🛒</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
            <p className="text-slate-500 max-w-md">We currently don't have any items in this category available for delivery to {zipcode}.</p>
          </div>
        )}

        

        <div className={`grid gap-6 overflow-hidden ${isSingleColumn ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
          {loading
            ? Array.from({ length: 10 }).map((_, index) => <SkeletonCard key={index} isSingleColumn={isSingleColumn} />)
            : products.map((item) => {
                const isLiked = wishlist.some(w => w.id === item.id);
                return (
                  <div key={item.id} className="group bg-white p-5 border border-slate-100 rounded-2xl hover:border-slate-300 transition-all duration-300 relative block">
                    <button
                      onClick={(e) => toggleFavorite(e, item)}
                      className="absolute top-7 right-7 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full border border-slate-50 transition-all active:scale-90 hover:scale-110"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "#10b981" : "none"} stroke={isLiked ? "#10b981" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21Z" />
                      </svg>
                    </button>

                    <Link href={`/product/${item.slug}`}>
                      {/* ✅ EXACT IMAGE STYLE RESTORED */}
                      <div className={`overflow-hidden rounded-xl bg-slate-50 mb-5 relative ${isSingleColumn ? 'aspect-[16/9]' : 'aspect-square'}`}>
                        {item.image ? (
                          <img 
                            src={`http://localhost:8000${item.image}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl text-slate-300">📦</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold h-3 truncate">
                          {item.category_name || categoryName || "Product"}
                        </p>
                        <h3 className={`font-semibold text-slate-800 leading-snug line-clamp-2 ${isSingleColumn ? 'text-xl' : 'text-sm min-h-[40px]'}`}>
                          {item.name}
                        </h3>                
                        <p className="text-xs text-slate-400 font-medium h-4">
  {formatUnit(item.unit)}
</p>
                        <div className="flex items-baseline gap-2 mt-4">
                          <span className={`font-bold text-emerald-600 ${isSingleColumn ? 'text-2xl' : 'text-lg'}`}>
                            ₹{item.price}
                          </span>
                          {item.compare_price && (
                            <span className="text-xs text-slate-400 line-through font-medium">
                              ₹{item.compare_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
        </div>
      </section>
    </main>
  );
}