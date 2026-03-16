// src/components/CategoriesDesktop.tsx
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

export default function CategoriesDesktop() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real backend data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Replace this URL with your actual categories endpoint if different
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
    <section className="py-6">
      {/* Centered Minimal Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Shop by <span className="text-[#00b8d9]">Category</span>
        </h2>
      </div>

      {/* Grid Layout - Adjusted for 10 items 
          - lg:grid-cols-5 creates 2 perfect rows of 5 items
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-6 justify-items-center max-w-7xl mx-auto">
        
        {loading ? (
          /* Simple loading skeleton placeholders matching the grid */
          Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className="flex flex-col items-center gap-4 w-full animate-pulse">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-slate-200"></div>
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
             </div>
          ))
        ) : (
          categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/categories/${cat.slug}`}
              className="group flex flex-col items-center gap-4 w-full"
            >
              {/* Image Container with SVG Animation */}
              <div className="relative w-28 h-28 md:w-36 md:h-36">
                
                {/* 1. Base Image Container (Rounded) */}
                <div className="w-full h-full rounded-full overflow-hidden border border-slate-100 relative z-10 bg-slate-50 flex items-center justify-center">
                  {cat.image ? (
                    <img 
                      src={`http://localhost:8000${cat.image}`} 
                      alt={cat.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  ) : (
                    <span className="text-2xl">🥩</span> // Fallback icon if no image
                  )}
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                </div>

                {/* 2. SVG Animated Border Overlay */}
                <svg 
                  className="absolute top-[-4px] left-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none z-20" 
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50" cy="50" r="49"
                    fill="none"
                    strokeWidth="1" // <--- CHANGED FROM 2 TO 1 HERE
                    strokeLinecap="round"
                    className="stroke-emerald-500 transition-[stroke-dashoffset] duration-700 ease-in-out [stroke-dasharray:308] [stroke-dashoffset:308] group-hover:[stroke-dashoffset:0]"
                  />
                </svg>

              </div>

              {/* Category Name */}
              <h3 className="text-sm md:text-base font-bold text-slate-700 text-center group-hover:text-[#00b8d9] transition-colors leading-tight px-2">
                {cat.name}
              </h3>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}