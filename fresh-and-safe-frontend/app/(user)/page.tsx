// src/app/page.tsx
import React from 'react';

// Desktop Components
import BannerSliderDesktop from './home/BannerSliderDesktop';
import DailyDealsDesktop from './home/DailyDealsDesktop';
import CategoriesDesktop from './home/CategoriesDesktop';
import TestimonialsDesktop from './home/TestimonialsDesktop';

// Mobile Components
import BannerSliderMobile from './home/BannerSliderMobile';
import DailyDealsMobile from './home/DailyDealsMobile';
import CategoriesMobile from './home/CategoriesMobile';
import TestimonialsMobile from './home/TestimonialsMobile';

export default function Home() {
  return (
    <div className="bg-white">
      
      {/* --- HERO BANNER --- */}
      <div className="px-4 py-4 md:px-8 md:py-10 max-w-7xl mx-auto">
        <div className="block md:hidden">
          <BannerSliderMobile />
        </div>
        <div className="hidden md:block">
          <BannerSliderDesktop />
        </div>
      </div>

      {/* --- DAILY DEALS --- */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto mt-2 md:mt-10">
        <div className="block md:hidden">
          <DailyDealsMobile />
        </div>
        <div className="hidden md:block">
          <DailyDealsDesktop />
        </div>
      </div>

      {/* --- CATEGORIES --- */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto mt-8 md:mt-16 mb-6">
        <div className="block md:hidden">
          <CategoriesMobile />
        </div>
        <div className="hidden md:block">
          <CategoriesDesktop />
        </div>
      </div>

      {/* --- TESTIMONIALS (Mobile Only) --- */}
      <div className="block md:hidden mt-8">
         <TestimonialsMobile />
      </div>

      <div className="hidden md:block mt-20 mb-20">
         <TestimonialsDesktop />
      </div>

    </div>
  );
}