'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Loader2 } from 'lucide-react';

// Define the same interface as the Contact Page
interface ContactDetail {
  id: number;
  title: string;
  email: string;
  phone: string;
  description?: string;
}

const Footer = () => {
  const [details, setDetails] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data exactly like the Contact Page
  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/contact");
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
        }
      } catch (err) {
        console.error("Failed to fetch footer contact info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContactDetails();
  }, []);

  const linkRows = [
    [
      { name: 'Terms & Conditions', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy-policy' }, 
      { name: 'Refund Policy', href: '/refund-policy' }, 
    ],
    [
      { name: 'FAQ', href: '/faq' }, 
      { name: 'Blog', href: '/blogs' },
      { name: 'Newsroom', href: '/news' }, 
      { name: 'Contact Us', href: '/contact' }
    ]
  ];

  // Helper to get primary office data (first one in the list)
  const primaryOffice = details[0];

  return (
    <footer className="border-t border-slate-100 bg-white font-sans selection:bg-[#00b8d9]/10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Branding & Address */}
          <div className="md:col-span-4 flex flex-col gap-5">
            <Link href="/">
              <img 
                src="/FRESH & SAFE LOGO.png" 
                alt="Fresh & Safe Logo" 
                className="h-20 w-auto object-contain" 
              />
            </Link>
            
            {loading ? (
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[11px] uppercase font-bold tracking-widest">Updating Office Info...</span>
              </div>
            ) : (
              <address className="not-italic text-[13px] text-slate-500 leading-relaxed max-w-[280px] whitespace-pre-wrap">
                {/* Dynamically show the Description/Address from the API */}
                {primaryOffice?.description || "Address details coming soon."}
              </address>
            )}
          </div>

          {/* Center Column: Navigation Rows */}
          <div className="md:col-span-5">
            <nav className="flex flex-col gap-3">
              {linkRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {row.map((link) => (
                    <div key={link.name} className="flex items-center gap-2">
                      <span className="text-slate-900 text-[10px]">•</span>
                      <Link 
                        href={link.href}
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
              {loading ? (
                <div className="space-y-2 opacity-50">
                  <div className="h-3 w-32 bg-slate-100 animate-pulse rounded" />
                  <div className="h-3 w-48 bg-slate-100 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  {/* Dynamically show Phone and Email from the API */}
                  <p className="text-[13px] text-slate-400 mb-1">{primaryOffice?.phone}</p>
                  <p className="text-[13px] text-slate-400 hover:text-[#00b8d9] transition-colors">
                    <a href={`mailto:${primaryOffice?.email}`}>{primaryOffice?.email}</a>
                  </p>
                </>
              )}
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