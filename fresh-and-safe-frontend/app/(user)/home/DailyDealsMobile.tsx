// src/components/DailyDealsMobile.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Deal {
  id: string | number;
  name: string;
  image?: string;
  price: number;
  compare_price?: number; 
  unit?: string;
  slug?: string;
  category_name?: string;
  is_available?: boolean;
}

export default function DailyDealsMobile() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Deal[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Fetch real backend data
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const storedZip = localStorage.getItem("zipcode") || "";
        const response = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${storedZip}`);
        
        if (response.ok) {
          const data = await response.json();
          setDeals(data.daily_deals || []);
        }
      } catch (error) {
        console.error('Failed to fetch daily deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // ✅ Load wishlist from localStorage & backend
  useEffect(() => {
    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      fetch(`http://localhost:8000/api/v1/wishlist/${parsedUser.id}`)
        .then(res => res.json())
        .then(dbWishlist => {
          if (Array.isArray(dbWishlist)) {
            setWishlist(dbWishlist);
            localStorage.setItem("wishlist", JSON.stringify(dbWishlist));
          }
        })
        .catch(err => console.error("Failed to fetch wishlist", err));
    }
  }, []);

  // ✅ Toggle wishlist with localStorage + backend sync
  // ✅ Toggle wishlist with localStorage + backend sync
  const toggleWishlist = async (e: React.MouseEvent, product: Deal) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ GATEKEEPER: Check if the user is logged in FIRST!
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setPopupMessage("Please login to manage wishlist");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return; // 🛑 Block the action for guests!
    }

    const isLoved = wishlist.some(item => item.id === product.id);
    let updatedWishlist: Deal[];

    if (isLoved) {
      updatedWishlist = wishlist.filter(item => item.id !== product.id);
    } else {
      updatedWishlist = [...wishlist, product];
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    setPopupMessage(isLoved ? "Removed from wishlist" : "Added to wishlist");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);

    const parsedUser = JSON.parse(storedUser);
    try {
      await fetch("http://localhost:8000/api/v1/wishlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parsedUser.id,
          product_ids: updatedWishlist.map(item => item.id),
        }),
      });
    } catch (error) {
      console.error("Wishlist sync failed", error);
    }
  };

  return (
    <section>
      {/* Toast Popup */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 ease-out pointer-events-none ${showPopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2.5">
          <div className={`${popupMessage.includes('Added') ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full p-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {popupMessage.includes('Added') ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18" />}
            </svg>
          </div>
          <span className="text-xs font-medium text-white whitespace-nowrap">{popupMessage}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-extrabold text-slate-900">
          Daily <span className="text-[#00b8d9]">Deals</span>
        </h2>
        
        <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
          <span>Swipe</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Scrollable Container */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="min-w-[160px] max-w-[160px] snap-start bg-white border border-slate-100 rounded-2xl p-3 animate-pulse"
            >
              <div className="h-32 rounded-xl bg-slate-200 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                <div className="h-2 bg-slate-200 rounded w-1/3 mt-2"></div>
                <div className="flex gap-1.5 mt-2">
                  <div className="h-4 bg-emerald-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          deals.map((item) => {
            const isLiked = wishlist.some(w => w.id === item.id);
            return (
              <div 
                key={item.id} 
                className="min-w-[160px] max-w-[160px] snap-start bg-white border border-slate-100 rounded-2xl p-3 relative"
              >
                {/* Wishlist Button */}
                <button
                  onClick={(e) => toggleWishlist(e, item)}
                  className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-slate-50 active:scale-90 transition-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill={isLiked ? "#10b981" : "none"}
                    stroke={isLiked ? "#10b981" : "#94a3b8"}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21Z" />
                  </svg>
                </button>

                <Link href={`/product/${item.slug || item.id}`} className="block">
                  {/* ✅ UPDATED: Added grayscale and Out of Stock Badge */}
                  <div className={`h-32 rounded-xl overflow-hidden mb-3 relative bg-slate-50 flex items-center justify-center ${item.is_available === false ? 'grayscale opacity-70' : ''}`}>
                    {item.image ? (
                      <img 
                        src={`http://localhost:8000${item.image}`} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-3xl">🥩</span>
                    )}
                    
                    {/* ✅ NEW: The Stockout Badge */}
                    {item.is_available === false && (
                      <div className="absolute top-2 left-2 bg-gray-900/90 text-white text-[9px] font-extrabold px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm z-10 shadow-sm">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold truncate">
                      {item.category_name || 'Offer'}
                    </p>
                    <h3 className="font-semibold text-slate-800 text-xs line-clamp-2 h-8 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">{item.unit || '1 Pack'}</p>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="font-bold text-emerald-600 text-sm">₹{item.price}</span>
                      {item.compare_price && (
                        <span className="text-[10px] text-slate-400 line-through">₹{item.compare_price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}