"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // ✅ Points to the new user-specific backend endpoint you created
        const res = await fetch("http://localhost:8000/api/v1/faqs");
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

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors">
            ← Back to Store
          </Link>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-500 text-lg">Have questions? We're here to help.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="font-medium">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border text-center shadow-sm">
            <p className="text-gray-500 font-medium">No frequently asked questions available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;

              return (
                <div 
                  key={faq.id} 
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${
                    isOpen ? "border-green-500 ring-4 ring-green-50" : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  >
                    <span className={`font-bold text-lg pr-8 ${isOpen ? "text-green-700" : "text-gray-800"}`}>
                      {faq.question}
                    </span>
                    <ChevronDown 
                      className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-green-600" : "text-gray-400"
                      }`} 
                    />
                  </button>

                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2 text-gray-600 leading-relaxed border-t border-gray-50 mx-6">
                      <p className="whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 bg-green-50 border border-green-100 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">If you cannot find the answer to your question in our FAQ, you can always contact us.</p>
          {/* ✅ Adjust this link if your contact page is also inside / */}
          <Link href="/contact" className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all">
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}