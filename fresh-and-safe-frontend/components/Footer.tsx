'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  // CHANGED: We now use objects with 'name' and 'href' so we can route them properly
  const linkRows = [
    [
      { name: 'FAQ', href: '/faq' }, // <-- This now links to your new app/faq/page.tsx
      { name: 'Newsroom', href: '/newsroom' }, 
      { name: 'Blog', href: '/blog' }
    ],
    [
      { name: "Didn't find your product?", href: '/request-product' }, 
      { name: 'Terms & Conditions', href: '/terms' }
    ],
    [
      { name: 'Privacy Policy', href: '/privacy' }, 
      { name: 'Refund Policy', href: '/refund' }, 
      { name: 'Sellers', href: '/sellers' }
    ],
    [
      { name: 'Contact Us', href: '/contact' }
    ]
  ];

  return (
    <footer className="border-t border-slate-100 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Branding & Address */}
          <div className="md:col-span-4 flex flex-col gap-5">
            <div className="flex items-center">
              <Link href="/">
                <img 
                  src="/FRESH & SAFE LOGO.png" 
                  alt="Fresh & Safe Logo" 
                  className="h-20 w-auto object-contain" 
                />
              </Link>
            </div>
            
            <address className="not-italic text-[13px] text-slate-500 leading-relaxed max-w-[280px]">
              Freshtohome Foods Private Limited No. 1, 2nd Floor,<br />
              Carlton Towers, Old Airport Road,<br />
              Bangalore – 560008
            </address>
          </div>

          {/* Center Column: Navigation Rows */}
          <div className="md:col-span-5">
            <nav className="flex flex-col gap-3">
              {linkRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* CHANGED: We map over 'link' objects instead of 'linkName' strings */}
                  {row.map((link) => (
                    <div key={link.name} className="flex items-center gap-2">
                      <span className="text-slate-900 text-[10px]">•</span>
                      <Link 
                        href={link.href} // <-- This dynamically applies the URL from the array above
                        className="text-[13px] text-slate-600 hover:text-[#00b8d9] transition-colors whitespace-nowrap"
                      >
                        {link.name}
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </nav>
            <p className="mt-8 text-[13px] text-slate-400 leading-snug max-w-sm">
              Order your daily Fish, Poultry and Mutton. Get it delivered at your door steps.
            </p>
          </div>

          {/* Right Column: Contact & Socials */}
          <div className="md:col-span-3 flex flex-col gap-6 lg:pl-8">
            <div>
              <h4 className="text-slate-800 font-bold text-sm mb-3">Contact Us</h4>
              <p className="text-[13px] text-slate-400 mb-1">1800-313-3302</p>
              <p className="text-[13px] text-slate-400">customercare@freshtohome.com</p>
            </div>

            <div>
              <h4 className="text-slate-800 font-bold text-sm mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <SocialLink Icon={Facebook} href="#" />
                <SocialLink Icon={Twitter} href="#" />
                <SocialLink Icon={Instagram} href="#" />
                <SocialLink Icon={Youtube} href="#" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-50 py-6 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Fresh & Safe. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

// Helper component
const SocialLink = ({ Icon, href }: { Icon: any, href: string }) => (
  <Link 
    href={href} 
    className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center text-slate-900 hover:border-[#00b8d9] hover:text-[#00b8d9] hover:bg-slate-50 transition-all duration-200"
  >
    <Icon size={16} />
  </Link>
);

export default Footer;