"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

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
    
    // 1. Get Token and verify it exists
    const token = localStorage.getItem("token");
    console.log("Submit Debug - Token:", token ? "Found" : "NOT FOUND");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("slug", formData.slug);
    data.append("content", formData.content);
    data.append("status", String(formData.status));
    
    // 2. Only append date if it has a value to avoid backend 422 errors
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
            Authorization: `Bearer ${token}`, // Ensure this is exactly "Bearer <token>"
            "Content-Type": "multipart/form-data" 
        }
      });

      router.push("/admin/news");
    } catch (err: any) {
      console.error("Save Error Detail:", err.response?.data);
      alert("Error: " + (err.response?.data?.detail || "Action failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* ... (Rest of your JSX is fine) ... */}
      <div className="flex items-center mb-8 space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800">{editingId ? "Edit Article" : "Write News"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Article Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full border p-3 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">URL Slug</label>
            <input name="slug" value={formData.slug} onChange={handleChange} className="w-full border p-3 rounded" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Content</label>
          <textarea name="content" value={formData.content} onChange={handleChange} className="w-full border p-3 rounded h-64 font-mono text-sm" placeholder="Write article here..." required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Feature Image</label>
            <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="w-full border p-2 rounded bg-gray-50" accept="image/*" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Publish Date</label>
            <input type="datetime-local" name="published_at" value={formData.published_at} onChange={handleChange} className="w-full border p-3 rounded" />
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded">
          <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} id="news-status" className="h-5 w-5 text-green-600" />
          <label htmlFor="news-status" className="font-semibold text-gray-700">Publish Immediately</label>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? "Saving..." : editingId ? "Update Article" : "Save Article"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddNewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsFormContent />
    </Suspense>
  );
}