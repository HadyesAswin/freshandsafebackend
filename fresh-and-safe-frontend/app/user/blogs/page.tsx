"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, ArrowRight, User, Calendar } from "lucide-react";

interface BlogItem {
  id: number;
  title: string;
  slug: string;
  author: string;
  content: string;
  feature_image?: string;
  published_at: string;
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/user/blogs");
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch Blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Our Blog</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Expert tips, healthy recipes, and the latest from the world of organic farming.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="font-medium">Loading stories...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border text-center shadow-sm max-w-2xl mx-auto">
            <p className="text-gray-500 font-medium text-lg">Our writers are working on something special. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                href={`/user/blogs/${blog.slug}`}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col"
              >
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  {blog.feature_image ? (
                    <img 
                      src={`http://localhost:8000${blog.feature_image}`} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <BookOpen className="w-16 h-16 opacity-10" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-green-700 uppercase tracking-widest shadow-sm">
                      Fresh Article
                    </span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-tighter mb-4">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-green-500" /> {formatDate(blog.published_at)}</span>
                    <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-green-500" /> {blog.author}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors line-clamp-2 leading-tight">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-500 mb-8 line-clamp-3 text-sm leading-relaxed flex-1">
                    {blog.content.replace(/<[^>]*>?/gm, '')} {/* Strips HTML if any */}
                  </p>
                  
                  <div className="flex items-center text-sm font-black text-green-600 mt-auto pt-4 border-t border-gray-50">
                    Keep Reading <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
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