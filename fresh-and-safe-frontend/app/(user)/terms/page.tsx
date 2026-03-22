"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface TermsDocument {
  id: number;
  title: string;
  description: string;
  updated_at: string;
}

export default function TermsPage() {
  const [terms, setTerms] = useState<TermsDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/user/terms");
        if (res.ok) {
          const data = await res.json();
          setTerms(data);
        }
      } catch (err) {
        console.error("Failed to fetch Terms & Conditions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#00b8d9]/20 selection:text-[#00b8d9]">
      {/* 1. INCREASED MAX-WIDTH: Changed max-w-4xl to max-w-6xl to eat up the side margins */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 md:py-16">
        
        {/* PAGE HEADER */}
        <header className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text">
            Terms & Conditions
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
            Please read these terms carefully before using our services.
          </p>
          
          {/* Subtle Last Updated Tag */}
          {!loading && terms.length > 0 && terms[0]?.updated_at && (
            <div className="mt-4 inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
              <span className="text-xs font-medium text-gray-500">
                Last updated on <span className="text-gray-900 font-semibold">{formatDate(terms[0].updated_at)}</span>
              </span>
            </div>
          )}
        </header>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#00b8d9]" />
            <span className="font-medium text-sm">Loading documents...</span>
          </div>
        ) : terms.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium text-sm">No terms and conditions are currently available.</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {terms.map((doc) => (
              <section key={doc.id} className="group border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                {/* 2. INCREASED GAP: Added md:gap-12 and lg:gap-16 to push the left and right sides further apart */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 lg:gap-16">
                  
                  {/* Left Side: Title */}
                  <div className="md:col-span-4 lg:col-span-3">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 md:mt-1">
                      {doc.title}
                    </h2>
                  </div>
                  
                  {/* Right Side: Text Content */}
                  <div className="md:col-span-8 lg:col-span-9">
                    <div className="prose prose-sm md:prose-base prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                      {doc.description}
                    </div>
                  </div>

                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}