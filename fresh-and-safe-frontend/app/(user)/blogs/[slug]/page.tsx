"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Share2 } from "lucide-react";

interface BlogDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  author: string;
  feature_image?: string;
  published_at: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/user/blogs/${slug}`);
        if (!res.ok) throw new Error("Blog not found");
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#00b8d9]" />
      <p className="text-sm font-medium text-gray-400">Opening story...</p>
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Article not found</h1>
      <Link href="/blogs" className="text-[#00b8d9] font-bold hover:underline flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Return to Blogs
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#00b8d9]/20 selection:text-[#00b8d9]">
      
      {/* HEADER NAVBAR - Synced Style */}
      

      {/* ARTICLE CONTAINER */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 md:py-16">
        
        {/* MASTER GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: Metadata & Actions (col-span-3) */}
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="md:sticky md:top-32 space-y-8">
              
              {/* Post Info */}
              <div className="space-y-1 border-l-2 border-[#00b8d9] pl-4">
                <p className="text-xs font-bold text-[#00b8d9] uppercase tracking-widest">
                  Published
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(blog.published_at)}
                </p>
              </div>

              <div className="space-y-1 border-l-2 border-gray-100 pl-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Written By
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {blog.author}
                </p>
              </div>

              {/* Share Button */}
              <button 
                onClick={() => window.navigator.share?.({ title: blog.title, url: window.location.href })}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#00b8d9] transition-colors uppercase tracking-widest pt-4"
              >
                <Share2 className="w-4 h-4" /> Share Article
              </button>
            </div>
          </aside>

          {/* RIGHT COLUMN: The Main Content (col-span-9) */}
          <article className="md:col-span-8 lg:col-span-9">
            
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15] mb-8">
              {blog.title}
            </h1>

            {/* Featured Image */}
            {blog.feature_image && (
              <div className="mb-12 rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                <img 
                  src={`http://localhost:8000${blog.feature_image}`} 
                  alt={blog.title} 
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              </div>
            )}

            {/* Article Body */}
            <div className="prose prose-gray md:prose-lg max-w-none text-gray-600 leading-loose whitespace-pre-wrap break-words">
              {blog.content}
            </div>

            {/* Footer Tag */}
            <div className="mt-16 pt-10 border-t border-gray-100">
                <p className="text-sm text-gray-400 italic">
                    Thank you for reading the Fresh & Safe blog. For more healthy tips and updates, follow our journey.
                </p>
            </div>
          </article>

        </div>
      </div>
    </main>
  );
}