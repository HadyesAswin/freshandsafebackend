// src/components/BannerSliderMobile.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Define the interface for your banner data
interface Banner {
  id: number;
  image: string;
}

export default function BannerSliderMobile() {
  const [slides, setSlides] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  // Fetch real backend data
  useEffect(() => {
    const fetchBanners = async () => {
      try {
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

  // Auto-slide functionality (same logic as desktop for consistency)
  useEffect(() => {
    // Prevent the timer from running if there's only 1 slide or data hasn't loaded
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000); // Faster slide change for mobile (4s)

    return () => clearInterval(timer);
  }, [slides.length]);

  // Show a loading skeleton while the banners are being fetched
  if (slides.length === 0) {
    return <div className="w-full h-[200px] rounded-[2rem] bg-slate-100 shadow-sm animate-pulse"></div>;
  }

  return (
    // Fixed height h-[200px] matching your request
    <div className="relative w-full h-[200px] rounded-[2rem] overflow-hidden bg-slate-100 shadow-sm">
      
      {/* Slides Container */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Prepended localhost URL to the image path */}
          <img
            src={`http://localhost:8000${slide.image}`}
            alt={`Mobile Banner ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Minimal Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              current === index 
                ? 'w-6 bg-white' 
                : 'w-1.5 bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}