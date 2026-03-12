"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Newspaper, 
  Type, 
  Link2, 
  FileText, 
  Calendar, 
  Image as ImageIcon, 
  Save, 
  Loader2,
  Info
} from "lucide-react";

function NewsFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: true,
    published_at: "",
  });

  // ✅ AUTO-GENERATE SLUG FROM TITLE (Works for both Adding and Editing)
  useEffect(() => {
    if (formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with -
        .replace(/^-+|-+$/g, ""); // Trim dashes from start/end
      
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  useEffect(() => {
    if (editingId) {
      axios.get(`http://localhost:8000/api/v1/news/`).then((res) => {
        const item = res.data.find((n: any) => n.id === parseInt(editingId));
        if (item) {
          setFormData({
            title: item.title,
            slug: item.slug,
            content: item.content,
            status: item.status,
            published_at: item.published_at ? item.published_at.slice(0, 16) : "",
          });
        }
      });
    }
  }, [editingId]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem("admin_token");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("slug", formData.slug);
    data.append("content", formData.content);
    data.append("status", String(formData.status));
    
    if (formData.published_at) {
        data.append("published_at", formData.published_at);
    }
    
    if (selectedFile) data.append("feature_image", selectedFile);

    try {
      const url = editingId 
        ? `http://localhost:8000/api/v1/news/${editingId}`
        : "http://localhost:8000/api/v1/news/";
      
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

      router.push("/admin/news");
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.detail || "Action failed"));
    } finally {
      setLoading(false);
    }
  };

  // Reusable Tailwind classes matching the established theme
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-red-600" />
            {editingId ? "Edit Article" : "Write News"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create compelling stories and updates for your audience.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Title and Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Type className="w-3.5 h-3.5" /> Article Title
            </label>
            <input 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Enter a catchy headline..."
              className={inputClass} 
              required 
            />
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Link2 className="w-3.5 h-3.5" /> URL Slug
            </label>
            <input 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              placeholder="article-url-slug"
              className={`${inputClass} font-mono text-red-600 bg-red-50/30`} 
              required 
            />
          </div>
        </div>

        {/* Content Editor Area */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <FileText className="w-3.5 h-3.5" /> Main Content
          </label>
          <textarea 
            name="content" 
            value={formData.content} 
            onChange={handleChange} 
            className={`${inputClass} h-80 font-sans text-base leading-relaxed resize-y`} 
            placeholder="Tell your story here..." 
            required 
          />
        </div>

        {/* Media & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <ImageIcon className="w-3.5 h-3.5" /> Feature Image
            </label>
            <div className="flex items-center gap-3">
               <input 
                 type="file" 
                 onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                 className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer border border-gray-200 rounded-lg p-1.5" 
                 accept="image/*" 
               />
            </div>
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Calendar className="w-3.5 h-3.5" /> Scheduled Publish Date
            </label>
            <input 
              type="datetime-local" 
              name="published_at" 
              value={formData.published_at} 
              onChange={handleChange} 
              className={inputClass} 
            />
          </div>
        </div>

        {/* Status Toggle */}
        <div className="pt-4 flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-red-600">
                <Info className="w-5 h-5" />
             </div>
             <div>
                <span className="block text-sm font-bold text-gray-900">Publish Immediately</span>
                <span className="block text-xs text-gray-500 font-medium">Article will be live on the website once saved.</span>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="status" 
              checked={formData.status} 
              onChange={handleChange} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center gap-2 px-10 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? "Update Article" : "Save Article"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddNewsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading editor...</p>
      </div>
    }>
      <NewsFormContent />
    </Suspense>
  );
}