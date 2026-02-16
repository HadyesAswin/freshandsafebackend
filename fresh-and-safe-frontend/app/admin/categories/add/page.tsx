"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function CategoryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: 0,
    status: true,
  });

  // If editing, fetch the specific category data
  useEffect(() => {
    if (editingId) {
      axios.get(`http://localhost:8000/api/v1/categories/`).then((res) => {
        const item = res.data.find((c: any) => c.id === parseInt(editingId));
        if (item) {
          setFormData({
            name: item.name,
            slug: item.slug,
            description: item.description || "",
            display_order: item.display_order || 0,
            status: item.status,
          });
        }
      });
    }
  }, [editingId]);

  // ✅ Helper to clean strings for URLs
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: type === "checkbox" ? checked : value };

      // ✅ AUTO-GENERATE SLUG Logic
      // If we are typing in the 'name' field, update the 'slug' field automatically
      if (name === "name") {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("slug", formData.slug); // Send the auto-generated slug
    data.append("description", formData.description);
    data.append("display_order", String(formData.display_order));
    data.append("status", String(formData.status)); // Backend expects "true"/"false" string for FormData
    
    if (selectedFile) {
        data.append("image", selectedFile);
    }

    try {
      const url = editingId 
        ? `http://localhost:8000/api/v1/categories/${editingId}`
        : "http://localhost:8000/api/v1/categories/";
      
      await axios({
        method: editingId ? "put" : "post",
        url: url,
        data: data,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      router.push("/admin/categories");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error: Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center mb-8 space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back to List</button>
        <h1 className="text-2xl font-bold text-gray-800">{editingId ? "✏️ Edit Category" : "➕ Add New Category"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Category Name</label>
            <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                placeholder="e.g. Fresh Fruits"
                required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">URL Slug (Auto-generated)</label>
            <input 
                name="slug" 
                value={formData.slug} 
                onChange={handleChange} 
                className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none text-gray-600 font-mono" 
                placeholder="e.g. fresh-fruits"
                required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-3 rounded-lg h-32 focus:ring-2 focus:ring-green-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Display Image</label>
            <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="w-full border p-2 rounded-lg text-sm bg-gray-50" accept="image/*" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Display Order</label>
            <input type="number" name="display_order" value={formData.display_order} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          <span className="font-semibold text-gray-700 text-sm">Active (Visible on website)</span>
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition-all shadow-lg active:scale-95"
        >
            {loading ? "Saving..." : editingId ? "Update Category" : "Save Category"}
        </button>
      </form>
    </div>
  );
}

export default function CategoryAddPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Form...</div>}>
      <CategoryFormContent />
    </Suspense>
  );
}