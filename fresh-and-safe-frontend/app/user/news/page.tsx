"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, Loader2, ArrowRight } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  feature_image?: string;
  published_at: string;
  excerpt: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/user/news");
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (err) {
        console.error("Failed to fetch News:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors">
            ← Back to Store
          </Link>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Newspaper className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Latest News & Updates</h1>
          <p className="text-gray-500 text-lg">Stay up to date with Fresh & Safe.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="font-medium">Loading latest news...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border text-center shadow-sm max-w-2xl mx-auto">
            <p className="text-gray-500 font-medium text-lg">No news articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <Link 
                key={item.id} 
                href={`/user/news/${item.slug}`}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-56 bg-gray-100 overflow-hidden">
                  {item.feature_image ? (
                    <img 
                      src={`http://localhost:8000${item.feature_image}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Newspaper className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                    {formatDate(item.published_at)}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3 flex-1">
                    {item.excerpt}
                  </p>
                  
                  <div className="flex items-center text-sm font-bold text-green-600 mt-auto">
                    Read Full Story <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}