"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  BookOpen, 
  Type, 
  Link2, 
  FileText, 
  Calendar, 
  Image as ImageIcon, 
  Save, 
  Loader2,
  Info,
  User
} from "lucide-react";

function BlogFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    author: "Fresh & Safe Team",
    status: true,
    published_at: "",
    feature_image: "",
  });

  // ✅ FETCH DATA FOR EDITING
  useEffect(() => {
    if (editingId) {
      const token = localStorage.getItem("admin_token");
      axios.get(`http://localhost:8000/api/v1/admin/blogs/`, {
          headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        const item = res.data.find((n: any) => n.id === parseInt(editingId));
        if (item) {
          setFormData({
            title: item.title,
            slug: item.slug,
            content: item.content,
            author: item.author || "Fresh & Safe Team",
            status: item.status,
            published_at: item.published_at ? item.published_at.slice(0, 16) : "",
            feature_image: item.feature_image || "",
          });
        }
      });
    }
  }, [editingId]);

  // ✅ IMPROVED HANDLER: Generates slug ONLY when typing in the Title field
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "title") {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") 
        .replace(/[\s_-]+/g, "-") 
        .replace(/^-+|-+$/g, "");
      
      setFormData(prev => ({ 
        ...prev, 
        title: value, 
        slug: generatedSlug 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === "checkbox" ? checked : value 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem("admin_token");
    const data = new FormData();
    data.append("title", formData.title);
    data.append("slug", formData.slug);
    data.append("content", formData.content);
    data.append("author", formData.author);
    data.append("status", String(formData.status));
    
    if (formData.published_at) data.append("published_at", formData.published_at);
    if (selectedFile) data.append("feature_image", selectedFile);

    try {
      const url = editingId 
        ? `http://localhost:8000/api/v1/admin/blogs/${editingId}`
        : "http://localhost:8000/api/v1/admin/blogs/";
      
      const method = editingId ? "put" : "post";

      await axios({
        method: method,
        url: url,
        data: data,
        headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
        }
      });

      router.push("/admin/blogs");
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.detail || "Action failed"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            {editingId ? "Edit Blog Post" : "Write Blog"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create engaging content and stories for your blog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}><Type className="w-3.5 h-3.5" /> Blog Title</label>
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Enter blog title..." className={inputClass} required />
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}><Link2 className="w-3.5 h-3.5" /> URL Slug</label>
            <input name="slug" value={formData.slug} onChange={handleChange} placeholder="blog-url-slug" className={`${inputClass} font-mono text-red-600 bg-red-50/30`} required />
          </div>
        </div>

        <div>
            <label className={`${labelClass} flex items-center gap-2`}><User className="w-3.5 h-3.5" /> Author Name</label>
            <input name="author" value={formData.author} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label className={`${labelClass} flex items-center gap-2`}><FileText className="w-3.5 h-3.5" /> Main Content</label>
          <textarea name="content" value={formData.content} onChange={handleChange} className={`${inputClass} h-80 font-sans text-base leading-relaxed resize-y`} placeholder="Write your blog content here..." required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}><ImageIcon className="w-3.5 h-3.5" /> Feature Image</label>
            
            {editingId && formData.feature_image && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Current Image:</p>
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img src={`http://localhost:8000${formData.feature_image}`} alt="Current" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer border border-gray-200 rounded-lg p-1.5" accept="image/*" />
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}><Calendar className="w-3.5 h-3.5" /> Scheduled Publish Date</label>
            <input type="datetime-local" name="published_at" value={formData.published_at} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-red-600"><Info className="w-5 h-5" /></div>
             <div>
                <span className="block text-sm font-bold text-gray-900">Publish Immediately</span>
                <span className="block text-xs text-gray-500 font-medium">Post will be live once saved.</span>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-10 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingId ? "Update Post" : "Save Blog Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddBlogPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2"><Loader2 className="w-8 h-8 animate-spin text-red-600" /><p className="text-sm font-medium">Loading editor...</p></div>}>
      <BlogFormContent />
    </Suspense>
  );
}