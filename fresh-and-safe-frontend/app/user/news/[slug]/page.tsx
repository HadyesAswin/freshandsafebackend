"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";

interface NewsDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  feature_image?: string;
  published_at: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/user/news/${slug}`);
        if (!res.ok) throw new Error("Article not found");
        
        const data = await res.json();
        setArticle(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-green-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Article Not Found</h1>
        <p className="text-gray-500 mb-6">The news article you're looking for doesn't exist or was removed.</p>
        <button onClick={() => router.push("/user/news")} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">
          Back to News
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/user/news" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> All News
          </Link>
        </div>
      </header>

      {/* ARTICLE CONTENT */}
      <article className="max-w-4xl mx-auto px-6 py-10 md:py-16">
        
        {/* Title & Date */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold uppercase tracking-wider text-sm mb-4">
            <Calendar className="w-4 h-4" />
            {formatDate(article.published_at)}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            {article.title}
          </h1>
        </div>

        {/* Feature Image */}
        {article.feature_image && (
          <div className="w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden shadow-md mb-12">
            <img 
              src={`http://localhost:8000${article.feature_image}`} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text Content */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <div 
            className="prose prose-lg md:prose-xl max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
          >
            {/* If your admin panel uses a Rich Text Editor (like TinyMCE), use dangerouslySetInnerHTML here instead of whitespace-pre-wrap */}
            {article.content}
          </div>
        </div>

      </article>
    </main>
  );
}