"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Undo2, 
  Save, 
  Loader2, 
  Info,
  FileText,
  AlignLeft
} from "lucide-react";

function RefundPolicyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load policy if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/refund-policy/")
      .then((res) => {
        const item = res.data.find((p: any) => p.id === Number(id));
        if (item) {
          setTitle(item.title);
          setDescription(item.description);
          setStatus(item.status);
        }
      })
      .catch(() => {
        setMessage("Failed to load refund policy");
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");

    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("status", String(status));

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/refund-policy/${id}`
          : "http://localhost:8000/api/v1/refund-policy/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push("/admin/refundpolicy");
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
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      
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
            <Undo2 className="w-6 h-6 text-red-600" />
            {isEdit ? "Edit Refund Policy" : "Add Refund Policy"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? "Update your existing return and refund guidelines." : "Create a new return/refund guideline for your platform."}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Title Section */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <FileText className="w-4 h-4 text-red-500" /> 
            Policy Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. 7-Day Return Policy, Damaged Goods"
            required
          />
        </div>

        {/* Content Section */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <AlignLeft className="w-4 h-4 text-red-500" /> 
            Full Description / Content
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[300px] resize-y leading-relaxed`}
            placeholder="Enter the full policy text here..."
            required
          />
        </div>

        {/* Configuration Section */}
        <div className="pt-2">
          <label className="flex items-center cursor-pointer group w-max">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={status} 
                onChange={(e) => setStatus(e.target.checked)} 
                className="peer sr-only" 
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </div>
            <div className="ml-3">
              <span className="block text-sm font-semibold text-gray-900">Active Status</span>
              <span className="block text-[10px] text-gray-400 uppercase tracking-tighter">Visible on Website</span>
            </div>
          </label>
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
            {isEdit ? "Update Policy" : "Save Policy"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddRefundPolicyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <RefundPolicyFormContent />
    </Suspense>
  );
}