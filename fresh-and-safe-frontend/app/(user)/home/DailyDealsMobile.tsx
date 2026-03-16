// src/components/DailyDealsMobile.tsx
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
  slug?: string;
}

export default function DailyDealsMobile() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real backend data
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        // Grab zipcode from localStorage if available, otherwise pass empty string
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

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-extrabold text-slate-900">
          Daily <span className="text-[#00b8d9]">Deals</span>
        </h2>
        
        {/* Restored Swipe Hint with Standard SVG Arrow */}
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
          /* Mobile Loading Skeleton */
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
          deals.map((item) => (
            <div 
              key={item.id} 
              className="min-w-[160px] max-w-[160px] snap-start bg-white border border-slate-100 rounded-2xl p-3"
            >
              <Link href={`/product/${item.slug || item.id}`} className="block">
                <div className="h-32 rounded-xl overflow-hidden mb-3 relative bg-slate-50 flex items-center justify-center">
                  {item.image ? (
                    <img 
                      src={`http://localhost:8000${item.image}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-3xl">🥩</span> // Fallback icon
                  )}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-800 text-xs line-clamp-2 h-8 leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">{item.weight || '1 Pack'}</p>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="font-bold text-emerald-600 text-sm">₹{item.price}</span>
                    {item.compare_price && (
                      <span className="text-[10px] text-slate-400 line-through">₹{item.compare_price}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}