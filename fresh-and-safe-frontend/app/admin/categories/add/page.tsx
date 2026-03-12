"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FolderPlus, FolderEdit, Save, Loader2, Image as ImageIcon, Hash, AlignLeft } from "lucide-react";

function CategoryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null); // ✅ Added state for current image
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
          // ✅ Set the existing image if it exists
          if (item.image) {
            setCurrentImage(item.image);
          }
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
    const token = localStorage.getItem("admin_token");

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

  // Reusable Tailwind classes matching the new minimal theme
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  // ✅ Helper to show either the newly selected file or the existing database image
  const previewUrl = selectedFile 
    ? URL.createObjectURL(selectedFile) 
    : currentImage 
      ? `http://localhost:8000${currentImage}` 
      : null;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {editingId ? <FolderEdit className="w-6 h-6 text-gray-400" /> : <FolderPlus className="w-6 h-6 text-gray-400" />}
            {editingId ? "Edit Category" : "Add New Category"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? "Update the details and visibility of this category." : "Create a new product category for your store."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Core Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Category Name</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="e.g. Fresh Fruits"
              required 
            />
          </div>
          <div>
            <label className={labelClass}>URL Slug (Auto-generated)</label>
            <input 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              className={`${inputClass} font-mono text-gray-500 bg-gray-100 focus:bg-gray-100`} 
              placeholder="e.g. fresh-fruits"
              required 
            />
          </div>
        </div>

        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <AlignLeft className="w-4 h-4" /> Description
          </label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className={`${inputClass} min-h-[120px] resize-y`} 
            placeholder="Add a brief description about the products in this category..."
          />
        </div>

        {/* Media & Ordering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <ImageIcon className="w-4 h-4" /> Display Image
            </label>
            
            {/* ✅ Image Preview Section */}
            {previewUrl && (
              <div className="mb-3">
                <img 
                  src={previewUrl} 
                  alt="Category Preview" 
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" 
                />
              </div>
            )}

            <input 
              type="file" 
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 border border-gray-200 rounded-lg bg-white transition-all cursor-pointer" 
              accept="image/*" 
            />
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Hash className="w-4 h-4" /> Display Order
            </label>
            <input 
              type="number" 
              name="display_order" 
              value={formData.display_order} 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="0"
            />
          </div>
        </div>

        {/* Status Toggle */}
        <div className="pt-4">
          <label className="flex items-center cursor-pointer group w-max">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="peer sr-only" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </div>
            <div className="ml-3">
              <span className="block text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                Active Category
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Visible to customers on the website
              </span>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ml-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {editingId ? "Update Category" : "Save Category"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CategoryAddPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
        Loading form...
      </div>
    }>
      <CategoryFormContent />
    </Suspense>
  );
}