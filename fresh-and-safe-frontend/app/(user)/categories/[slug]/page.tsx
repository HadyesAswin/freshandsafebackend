'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from 'lucide-react';

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

export default function CategoryProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [isSingleColumn, setIsSingleColumn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [zipcode, setZipcode] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) { router.push("/"); return; }
    setZipcode(storedZip);

    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      fetch(`http://localhost:8000/api/v1/wishlist/${user.id}`)
        .then(res => res.json())
        .then(dbWishlist => {
          if (Array.isArray(dbWishlist)) {
            setWishlist(dbWishlist);
            localStorage.setItem("wishlist", JSON.stringify(dbWishlist));
          }
        })
        .catch(err => console.error("Failed to fetch wishlist", err));
    }

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

  const toggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setPopupMessage("Please login to use wishlist");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    const isLoved = wishlist.some((item) => item.id === product.id);
    let updatedWishlist: Product[];

    if (isLoved) {
      updatedWishlist = wishlist.filter((item) => item.id !== product.id);
    } else {
      updatedWishlist = [...wishlist, product];
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    setPopupMessage(isLoved ? "Removed from wishlist" : "Added to wishlist");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);

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

  const formatUnit = (unit?: string) => {
    if (!unit) return "";
    const normalized = unit.trim().toUpperCase();
    if (normalized === "KG" || normalized === "1KG" || normalized === "1 KG") return "1 Kilo Gram";
    return unit;
  };

  const formatTitle = (name: string) => {
    if (!name) return { first: "", last: "" };
    const words = name.split(" ");
    if (words.length === 1) return { first: words[0], last: "" };
    const last = words.pop();
    const first = words.join(" ");
    return { first, last };
  };

  const { first: titleFirst, last: titleLast } = formatTitle(categoryName);

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-slate-900 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></Link>
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
          <div className="w-10"></div>
        </div>
        {/* Desktop Skeleton Header */}
        <div className="hidden md:flex max-w-7xl mx-auto px-8 pt-6 pb-4 border-b border-slate-100 mb-6">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
        </div>
        {/* Skeleton Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white p-4 md:p-5 border border-slate-100 rounded-2xl animate-pulse">
                <div className="w-full aspect-square bg-slate-100 rounded-xl mb-4"></div>
                <div className="space-y-2">
                  <div className="h-2.5 w-16 bg-slate-100 rounded"></div>
                  <div className="h-3.5 w-full bg-slate-100 rounded"></div>
                  <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
                  <div className="h-5 w-20 bg-slate-100 rounded mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-24 md:pb-10 relative">

      {/* Toast — only rendered when triggered */}
      {popupMessage && (
        <div className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 ease-out ${showPopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
          <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2.5">
            <div className={`${popupMessage.includes('Added') ? 'bg-emerald-500' : popupMessage.includes('login') ? 'bg-amber-500' : 'bg-rose-500'} rounded-full p-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {popupMessage.includes('Added') ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18" />}
              </svg>
            </div>
            <span className="text-xs font-medium text-white whitespace-nowrap">{popupMessage}</span>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-slate-900 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <span className="font-semibold text-sm truncate max-w-[200px]">{categoryName || 'Category'}</span>
        <div className="flex bg-slate-100 p-0.5 rounded-lg">
          <button onClick={() => setIsSingleColumn(true)} className={`p-1.5 rounded-md transition-colors ${isSingleColumn ? 'bg-white text-[#00b8d9]' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
          </button>
          <button onClick={() => setIsSingleColumn(false)} className={`p-1.5 rounded-md transition-colors ${!isSingleColumn ? 'bg-white text-[#00b8d9]' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex max-w-7xl mx-auto px-8 pt-6 pb-4 border-b border-slate-100 mb-6 items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 capitalize">
          {titleFirst} {titleLast && <span className="text-[#00b8d9]">{titleLast}</span>}
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </p>
      </div>

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-2">No products available</h3>
          <p className="text-slate-500 text-sm max-w-sm mb-8 font-medium leading-relaxed">
            We currently don't have any items in <span className="font-bold text-slate-700">{categoryName}</span> available for delivery to <span className="font-bold text-slate-700">{zipcode}</span>.
          </p>
          <Link href="/" className="bg-[#00b8d9] text-white px-6 py-3 rounded-xl font-bold text-sm inline-block active:scale-95 transition-transform">
            Browse All Products
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-10">
          {/* Mobile category title + count */}
          <div className="md:hidden flex items-center justify-between px-1 mt-4 mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{products.length} Products</p>
          </div>

          <div className={`grid gap-3 md:gap-6 ${isSingleColumn ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
            {products.map((item) => {
              const isLiked = wishlist.some(w => w.id === item.id);
              return (
                <div key={item.id} className="group bg-white p-3 md:p-5 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all relative">
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => toggleFavorite(e, item)}
                    className={`absolute top-5 right-5 md:top-7 md:right-7 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full border border-slate-50 transition-all active:scale-90 ${isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "#10b981" : "none"} stroke={isLiked ? "#10b981" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21Z" />
                    </svg>
                  </button>

                  <Link href={`/product/${item.slug}`}>
                    {/* Image */}
                    <div className={`overflow-hidden rounded-xl bg-slate-50 mb-3 md:mb-5 relative ${isSingleColumn ? 'aspect-[16/9]' : 'aspect-square'}`}>
                      {item.image ? (
                        <img src={`http://localhost:8000${item.image}`} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="text-3xl text-slate-200">📦</span></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 font-bold truncate">
                        {item.category_name || categoryName}
                      </p>
                      <h3 className={`font-bold text-slate-800 leading-snug line-clamp-2 ${isSingleColumn ? 'text-lg' : 'text-xs md:text-sm min-h-[32px] md:min-h-[40px]'}`}>
                        {item.name}
                      </h3>
                      {item.unit && (
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium">
                          {formatUnit(item.unit)}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mt-2 md:mt-4">
                        <span className={`font-bold text-emerald-600 ${isSingleColumn ? 'text-xl' : 'text-sm md:text-lg'}`}>
                          ₹{item.price}
                        </span>
                        {item.compare_price && (
                          <span className="text-[10px] md:text-xs text-slate-400 line-through font-medium">
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
      )}
    </main>
  );
}