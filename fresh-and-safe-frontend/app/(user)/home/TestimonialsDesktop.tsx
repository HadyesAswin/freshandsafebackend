// src/components/TestimonialsDesktop.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Define the interface based on your backend Testimonial schema
interface Testimonial {
  id: number;
  name: string;
  description: string; // Backend uses 'description'
  photo?: string;      // Backend uses 'photo'
  place?: string;      // Backend uses 'place'
}

export default function TestimonialsDesktop() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const visibleItems = 3;
  // Calculate safely to avoid negative indexes if there are fewer than 3 items
  const maxIndex = Math.max(0, testimonials.length - visibleItems);

  // 1. Fetch real backend data
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const storedZip = localStorage.getItem("zipcode") || "";
        const response = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${storedZip}`);
        
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // 2. Standard carousel logic
  useEffect(() => {
    if (maxIndex <= 0) return; // Don't slide if not enough items
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(timer);
  }, [maxIndex]);

  // Hide section completely if loaded but no testimonials exist
  if (!loading && testimonials.length === 0) return null;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            What our <span className="text-[#00b8d9]">customers</span> say
          </h2>
          <p className="text-slate-500 mt-3 text-lg">Hear it directly from people like you</p>
        </div>

        {/* SLIDER WINDOW */}
        <div className="relative overflow-hidden">
          
          {loading ? (
             /* Loading Skeleton Matching Your Exact Design */
             <div className="flex gap-8">
               {Array.from({ length: 3 }).map((_, idx) => (
                 <div key={idx} className="w-1/3 bg-cyan-50/50 border border-cyan-100 rounded-[2rem] p-8 relative flex flex-col justify-between min-h-[250px] animate-pulse">
                   <div className="space-y-3 mt-4">
                     <div className="h-4 bg-cyan-200/50 rounded w-full"></div>
                     <div className="h-4 bg-cyan-200/50 rounded w-5/6"></div>
                     <div className="h-4 bg-cyan-200/50 rounded w-4/6"></div>
                   </div>
                   <div className="flex items-end justify-between mt-12">
                     <div className="space-y-3">
                       <div className="h-4 bg-cyan-200/50 rounded w-24"></div>
                       <div className="h-2 bg-cyan-200/50 rounded w-16"></div>
                     </div>
                     <div className="w-16 h-16 rounded-full bg-cyan-200/50"></div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            /* SLIDER TRACK */
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleItems)}%)` }}
            >
              {testimonials.map((item) => (
                <div 
                  key={item.id} 
                  // CONTAINER WIDTH:
                  // min-w-[33.333%] forces 3 items per row, just like 'grid-cols-3'
                  // px-4 creates the gap between cards
                  className="min-w-[33.333%] px-4"
                >
                  {/* EXACT CARD DESIGN */}
                  <div className="h-full bg-cyan-50/50 border border-cyan-100 rounded-[2rem] p-8 relative flex flex-col justify-between overflow-hidden group">
                    
                    {/* DRAWING BORDER ANIMATION */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                      <rect 
                        x="1" y="1" 
                        width="99.5%" 
                        height="99.5%" 
                        rx="30" ry="30" 
                        fill="none" 
                        stroke="#00b8d9" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        className="[stroke-dasharray:2000] [stroke-dashoffset:2000] group-hover:[stroke-dashoffset:0] transition-all duration-[1.5s] ease-in-out"
                      />
                    </svg>

                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00b8d9]/5 rounded-bl-full rounded-tr-[2rem] -z-0"></div>

                    {/* Quote Section */}
                    <div className="relative z-10 mb-8">
                      <span className="text-5xl text-[#00b8d9]/20 font-serif absolute -top-6 -left-2 group-hover:text-[#00b8d9]/40 transition-colors">“</span>
                      <p className="text-base font-bold text-slate-700 leading-relaxed italic relative">
                        "{item.description}" {/* Mapped to real description */}
                      </p>
                    </div>

                    {/* Bottom Section: Name & Image */}
                    <div className="flex items-end justify-between mt-auto relative z-10">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                        <div className="h-0.5 w-8 bg-[#00b8d9] my-1.5"></div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                          {item.place || 'Customer'} {/* Mapped to real place */}
                        </p>
                      </div>
                      
                      {/* User Image */}
                      <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-white group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                        {item.photo ? (
                          <img 
                            src={`http://localhost:8000${item.photo}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-xl text-[#00b8d9]">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optional: Dots Navigation */}
        {!loading && maxIndex > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-8 bg-[#00b8d9]' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}