// src/components/TestimonialsMobile.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Define the interface based on your backend Testimonial schema
interface Testimonial {
  id: number;
  name: string;
  description: string; // Backend uses description instead of quote
  photo?: string;      // Backend uses photo instead of image
  place?: string;      // Backend uses place instead of location
}

export default function TestimonialsMobile() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real backend data
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

  // Don't render the section if there's no data and it finished loading
  if (!loading && testimonials.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="px-4 mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
          What our <span className="text-[#00b8d9]">customers</span> say
        </h2>
        <p className="text-xs text-slate-500 mt-1">Hear it directly from people like you</p>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto gap-4 px-4 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {loading ? (
          /* Loading Skeleton Matching Mobile Card Design */
          Array.from({ length: 3 }).map((_, idx) => (
            <div 
              key={idx} 
              className="min-w-[280px] max-w-[280px] snap-center bg-cyan-50/50 border border-cyan-100 rounded-[1.5rem] p-6 relative flex flex-col justify-between overflow-hidden animate-pulse min-h-[200px]"
            >
               <div className="space-y-2 mt-4">
                 <div className="h-3 bg-cyan-200/50 rounded w-full"></div>
                 <div className="h-3 bg-cyan-200/50 rounded w-5/6"></div>
                 <div className="h-3 bg-cyan-200/50 rounded w-4/6"></div>
               </div>
               <div className="flex items-end justify-between mt-6">
                 <div className="space-y-2">
                   <div className="h-3 bg-cyan-200/50 rounded w-20"></div>
                   <div className="h-2 bg-cyan-200/50 rounded w-12"></div>
                 </div>
                 <div className="w-14 h-14 rounded-full bg-cyan-200/50"></div>
               </div>
            </div>
          ))
        ) : (
          /* Render Real Testimonials */
          testimonials.map((item) => (
            <div 
              key={item.id} 
              // CHANGED: Added 'overflow-hidden' to keep the design inside the box
              className="min-w-[280px] max-w-[280px] snap-center bg-cyan-50/50 border border-cyan-100 rounded-[1.5rem] p-6 relative flex flex-col justify-between overflow-hidden"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00b8d9]/5 rounded-bl-full rounded-tr-[1.5rem] -z-0"></div>

              {/* Quote Section */}
              <div className="relative z-10">
                <span className="text-4xl text-[#00b8d9]/20 font-serif absolute -top-4 -left-2">“</span>
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic relative">
                  "{item.description}" {/* Uses backend description */}
                </p>
              </div>

              {/* Bottom Section: Name & Image */}
              <div className="flex items-end justify-between mt-6 relative z-10">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                  <div className="h-0.5 w-6 bg-[#00b8d9] my-1"></div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                    {item.place || 'Customer'} {/* Uses backend place */}
                  </p>
                </div>
                
                {/* User Image or Initials Fallback */}
                <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                  {item.photo ? (
                    <img 
                      src={`http://localhost:8000${item.photo}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-lg text-[#00b8d9]">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}