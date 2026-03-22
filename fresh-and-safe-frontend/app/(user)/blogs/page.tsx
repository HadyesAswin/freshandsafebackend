"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

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
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#00b8d9]/20 selection:text-[#00b8d9]">


      {/* PAGE CONTENT CONTAINER */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 md:py-16">
        
        {/* PAGE HEADER */}
        <header className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text">
            Our Blog
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
            Expert tips, healthy recipes, and the latest from the world of organic farming.
          </p>
        </header>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#00b8d9]" />
            <span className="font-medium text-sm">Loading stories...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium text-sm">Our writers are working on something special. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-16">
            {blogs.map((blog) => (
              <section key={blog.id} className="group border-b border-gray-50 pb-12 last:border-0 last:pb-0">
                {/* GRID LAYOUT: Meta/Image on Left | Title/Content on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 lg:gap-16">
                  
                  {/* Left Side: Thumbnail and Metadata */}
                  <div className="md:col-span-4 lg:col-span-3">
                    {blog.feature_image && (
                      <div className="mb-4 rounded-2xl overflow-hidden aspect-video md:aspect-square bg-gray-100 border border-gray-100">
                        <img 
                          src={`http://localhost:8000${blog.feature_image}`} 
                          alt={blog.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#00b8d9] uppercase tracking-wider">
                        {formatDate(blog.published_at)}
                      </p>
                      <p className="text-sm font-medium text-gray-400">
                        By {blog.author}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right Side: Title and Excerpt */}
                  <div className="md:col-span-8 lg:col-span-9">
                    <Link href={`/blogs/${blog.slug}`}>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4 group-hover:text-[#00b8d9] transition-colors leading-tight">
                        {blog.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 text-base">
                      {blog.content.replace(/<[^>]*>?/gm, '')}
                    </p>
                    <Link 
                      href={`/blogs/${blog.slug}`}
                      className="inline-flex items-center text-sm font-bold text-[#00b8d9] hover:gap-2 transition-all"
                    >
                      Read Full Article <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
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