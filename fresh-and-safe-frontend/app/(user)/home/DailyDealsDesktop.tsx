// src/components/DailyDeals.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Define the interface based on your backend structure
interface Deal {
  id: string | number;
  name: string;
  image?: string;
  price: number;
  compare_price?: number; 
  weight?: string;
  category?: any; 
  category_name?: string;
  slug?: string;
}

export default function DailyDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Fetch real backend data
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        // Grab zipcode from localStorage if available, otherwise pass empty string
        const storedZip = localStorage.getItem("zipcode") || "";
        const response = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${storedZip}`);
        
        if (response.ok) {
          const data = await response.json();
          // The API returns { ..., daily_deals: [...] }
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

  const toggleFavorite = (e: React.MouseEvent, id: string | number) => {
    e.preventDefault(); // Prevent clicking the link
    e.stopPropagation(); // Stop event bubbling
    
    const isAdding = !favorites.includes(id);
    setFavorites(prev =>
      isAdding ? [...prev, id] : prev.filter(favId => favId !== id)
    );

    setPopupMessage(isAdding ? "Product added to wishlist" : "Product removed from wishlist");
    setShowPopup(true);

    // Hide popup after 2 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 2000);
  };

  return (
    <section>
      
      {/* Toast Popup */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out pointer-events-none ${
          showPopup ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className={`${popupMessage.includes('added') ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full p-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {popupMessage.includes('added') ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18" />}
            </svg>
          </div>
          <span className="text-sm font-medium text-white whitespace-nowrap">{popupMessage}</span>
        </div>
      </div>

      {/* Centered Minimal Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Daily <span className="text-[#00b8d9]">Deals</span>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {loading ? (
           /* Loading Skeleton matching the exact card design */
           Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="bg-white p-5 border border-slate-100 rounded-2xl animate-pulse">
               <div className="w-full aspect-square bg-slate-200 rounded-xl mb-5"></div>
               <div className="space-y-3">
                 <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                 <div className="h-4 bg-slate-200 rounded w-full"></div>
                 <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                 <div className="h-3 bg-slate-200 rounded w-1/4 mt-4"></div>
                 <div className="flex gap-2 mt-2">
                   <div className="h-5 bg-emerald-200 rounded w-1/3"></div>
                   <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                 </div>
               </div>
             </div>
           ))
        ) : (
          deals.map((item) => {
            const isLiked = favorites.includes(item.id);
            
            // Extracts the category string securely
            const categoryDisplay = item.category_name || item.category?.name || item.category || 'Offer';

            return (
              <div 
                key={item.id} 
                className="group bg-white p-5 border border-slate-100 rounded-2xl hover:border-slate-300 transition-all duration-300 relative block"
              >
                
                {/* Favorite Button */}
                <button 
                  onClick={(e) => toggleFavorite(e, item.id)}
                  className={`absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full border border-slate-50 transition-all active:scale-90 hover:scale-110 
                    ${isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                    fill={isLiked ? "#10b981" : "none"} 
                    stroke={isLiked ? "#10b981" : "#94a3b8"} 
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21Z" />
                  </svg>
                </button>

                {/* 👇 FIX: Changed from /products/ to /product/ */}
                <Link href={`/product/${item.slug || item.id}`}>
                  {/* Image Container */}
                  <div className="overflow-hidden rounded-xl bg-slate-50 mb-5 relative aspect-square flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={`http://localhost:8000${item.image}`} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <span className="text-4xl">🥩</span> // Fallback icon
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold truncate">
                      {categoryDisplay}
                    </p>
                    <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2 text-sm min-h-[40px]">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {item.weight || '1 Pack'}
                    </p>
                    
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="font-bold text-emerald-600 text-lg">
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
          })
        )}
      </div>
    </section>
  );
}