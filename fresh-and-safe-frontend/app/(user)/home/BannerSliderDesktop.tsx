'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Optional: Define the interface for TypeScript
interface Banner {
  id: number;
  image: string;
  url?: string;
}

export default function BannerSlider() {
  const [slides, setSlides] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  // 1. Fetch real backend data
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Replace this URL with your actual banners endpoint if different
        const response = await fetch('http://localhost:8000/api/v1/banners'); 
        if (response.ok) {
          const data = await response.json();
          setSlides(data);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      }
    };

    fetchBanners();
  }, []);

  // 2. Auto-slide functionality
  useEffect(() => {
    // Don't start the timer if there are no slides or only 1 slide
    if (slides.length <= 1) return; 

    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [slides.length]);

  // Optional: Show a blank skeleton or nothing while loading
  if (slides.length === 0) {
    return <div className="w-full h-[200px] md:h-[400px] bg-slate-100 rounded-[2rem] md:rounded-[3rem] animate-pulse"></div>;
  }

  return (
    <div className="relative w-full h-[200px] md:h-[400px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group bg-slate-100">
      
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {slide.url ? (
            <Link href={slide.url} className="block w-full h-full">
              <img
                src={`http://localhost:8000${slide.image}`}
                alt={`Banner slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </Link>
          ) : (
            <img
              src={`http://localhost:8000${slide.image}`}
              alt={`Banner slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}

      {/* Dots Indicator */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-300 shadow-sm border border-white/20 ${
              current === index 
                ? 'w-8 bg-[#00b8d9]' 
                : 'w-2 bg-white/60 hover:bg-white'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}