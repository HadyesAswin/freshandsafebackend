"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/faq");
        if (res.ok) {
          const data = await res.json();
          setFaqs(data);
        }
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#00b8d9]/20 selection:text-[#00b8d9]">
      

      {/* PAGE CONTENT CONTAINER - Wide layout for PC */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 md:py-16">
        
        {/* PAGE HEADER */}
        <header className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
            Quick answers to common questions about our products, delivery, and services.
          </p>
        </header>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#00b8d9]" />
            <span className="font-medium text-sm">Loading FAQs...</span>
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium text-sm">No questions available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-10 md:space-y-16">
            {faqs.map((faq) => (
              <section key={faq.id} className="group border-b border-gray-50 pb-10 last:border-0 last:pb-0">
                {/* GRID LAYOUT: Question on Left / Answer on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 lg:gap-16">
                  
                  {/* Left Side: Question */}
                  <div className="md:col-span-4 lg:col-span-3">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
                      {faq.question}
                    </h2>
                  </div>
                  
                  {/* Right Side: Answer */}
                  <div className="md:col-span-8 lg:col-span-9">
                    <div className="prose prose-sm md:prose-base prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                      {faq.answer}
                    </div>
                  </div>

                </div>
              </section>
            ))}
          </div>
        )}

        {/* FOOTER CALL TO ACTION */}
        <div className="mt-20 pt-10 border-t border-gray-100 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-500 mb-6">If you couldn't find what you're looking for, we're just a message away.</p>
          <Link 
            href="/contact" 
            className="inline-block bg-[#00b8d9] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#009ab5] transition-all shadow-lg shadow-[#00b8d9]/20"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}