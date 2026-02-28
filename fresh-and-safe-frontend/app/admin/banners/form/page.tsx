"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Hash, 
  Link as LinkIcon, 
  Save, 
  Info, 
  Layout, 
  X 
} from "lucide-react";

function BannerFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [displayOrder, setDisplayOrder] = useState(0);
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const isEdit = Boolean(id);

  // Load data if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/banners/")
      .then((res) => {
        const banner = res.data.find((b: any) => b.id === Number(id));
        if (banner) {
          setDisplayOrder(banner.display_order);
          setUrl(banner.url || "");
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");

    const data = new FormData();
    data.append("display_order", String(displayOrder));
    data.append("url", url);
    if (image) data.append("image", image);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/banners/${id}`
          : "http://localhost:8000/api/v1/banners/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/banners");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    }
  };

  // Standardized styling classes
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layout className="w-6 h-6 text-red-600" />
            {isEdit ? "Edit Banner" : "Add New Banner"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? "Update the visual display and link for this promotion." : "Upload a new marketing banner for your storefront."}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 animate-pulse">
          <Info className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Banner Media Section */}
        <div>
          <label className={labelClass}>Banner Image</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative group">
            <div className="space-y-1 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300 group-hover:text-red-300 transition-colors" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    required={!isEdit} 
                  />
                </label>
                <p className="pl-1 text-gray-500">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-400 font-medium">Recommended: 1920x600px (Max 5MB)</p>
              {image && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-red-600 font-bold bg-red-50 py-1 px-3 rounded-full border border-red-100 mx-auto w-max">
                  <CheckCircleIcon className="w-3 h-3" />
                  {image.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Hash className="w-3.5 h-3.5" /> Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className={inputClass}
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <LinkIcon className="w-3.5 h-3.5" /> Redirect URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
              placeholder="e.g. /products/fruits"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            {isEdit ? "Update Banner" : "Save Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper icon
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export default function BannerFormPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <BannerFormContent />
    </Suspense>
  );
}