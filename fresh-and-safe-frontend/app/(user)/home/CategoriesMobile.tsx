// src/components/CategoriesMobile.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Define the interface based on your backend Category schema
interface Category {
  id: number | string;
  name: string;
  image?: string;
  slug: string;
}

export default function CategoriesMobile() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real backend data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section>
      {/* 1. Header: Aligned Left */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-extrabold text-slate-900">
          Shop by <span className="text-[#00b8d9]">Category</span>
        </h2>
      </div>

      {/* 2. Grid Layout: 4 cols */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-8 px-2">
        {loading ? (
          /* Mobile loading skeleton */
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 w-full animate-pulse">
              <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-slate-200"></div>
              <div className="h-3 w-12 bg-slate-200 rounded"></div>
            </div>
          ))
        ) : (
          categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/categories/${cat.slug}`} 
              className="flex flex-col items-center gap-3 w-full group"
            >
              {/* Circle Image Container */}
              <div className="w-[4.5rem] h-[4.5rem] rounded-full overflow-hidden border border-slate-100 bg-slate-50 shadow-sm group-active:scale-95 transition-transform flex items-center justify-center">
                 {cat.image ? (
                   <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-xl">🥩</span> /* Fallback if no image */
                 )}
              </div>
              
              {/* Category Name */}
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight max-w-[70px]">
                {cat.name}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}