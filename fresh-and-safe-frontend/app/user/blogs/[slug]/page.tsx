"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Calendar, User, Share2 } from "lucide-react";

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
  const router = useRouter();
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

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-green-600" />
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Post not found</h1>
      <Link href="/user/blogs" className="text-green-600 font-bold hover:underline">Return to Blogs</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-white pb-20 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">Fresh<span className="text-slate-800">&Safe</span></Link>
          <Link href="/user/blogs" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blogs
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 text-xs font-black text-green-600 uppercase tracking-widest mb-6">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(blog.published_at).toLocaleDateString()}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> By {blog.author}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-8">
            {blog.title}
          </h1>
        </header>

        {blog.feature_image && (
          <div className="w-full h-[300px] md:h-[550px] rounded-[2rem] overflow-hidden shadow-2xl mb-16">
            <img 
              src={`http://localhost:8000${blog.feature_image}`} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="prose prose-lg md:prose-xl text-gray-700 leading-[1.8] whitespace-pre-wrap font-medium">
            {blog.content}
          </div>
          
          <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">FS</div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Written By</p>
                    <p className="text-sm font-black text-gray-900">{blog.author}</p>
                </div>
            </div>
            <button className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all">
                <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}