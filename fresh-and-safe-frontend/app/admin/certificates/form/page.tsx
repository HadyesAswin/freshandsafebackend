"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Award, 
  Hash, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  Info,
  CheckCircle2
} from "lucide-react";

function CertificateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [displayOrder, setDisplayOrder] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(id);

  // Load data if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/certificates/")
      .then((res) => {
        const cert = res.data.find((c: any) => c.id === Number(id));
        if (cert) setDisplayOrder(cert.display_order);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("display_order", String(displayOrder));
    if (image) data.append("image", image);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/certificates/${id}`
          : "http://localhost:8000/api/v1/certificates/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/certificates");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    } finally {
      setLoading(false);
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
            <Award className="w-6 h-6 text-red-600" />
            {isEdit ? "Edit Certificate" : "Add Certificate"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? "Update the existing document details." : "Upload a new certification document for display."}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Certificate Media Section */}
        <div>
          <label className={labelClass}>Certificate Document / Image</label>
          <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative group cursor-pointer">
            <div className="space-y-2 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300 group-hover:text-red-400 transition-colors" />
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer rounded-md font-bold text-red-600 hover:text-red-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    required={!isEdit} 
                  />
                </label>
                <p className="pl-1 text-gray-500 font-medium">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">JPG, PNG, or SVG (Max 5MB)</p>
              {image && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 py-1.5 px-4 rounded-full border border-red-100 animate-in zoom-in-95">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {image.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Order Section */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <Hash className="w-3.5 h-3.5 text-red-500" /> 
            Display Order
          </label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className={inputClass}
            placeholder="e.g. 1"
          />
          <p className="mt-2 text-[11px] text-gray-400 font-medium italic">
            * Higher numbers appear later in the list.
          </p>
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
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Certificate" : "Save Certificate"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CertificateFormPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <CertificateFormContent />
    </Suspense>
  );
}