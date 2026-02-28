"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  HelpCircle, 
  Save, 
  Loader2, 
  MessageCircleQuestion, 
  AlignLeft, 
  Hash 
} from "lucide-react";

function FAQFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    display_order: 0,
    status: true,
  });

  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/faq/").then((res) => {
        const item = res.data.find((f: any) => f.id === parseInt(editingId));
        if (item) setFormData({ 
            question: item.question, 
            answer: item.answer, 
            display_order: item.display_order, 
            status: item.status 
        });
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const url = editingId ? `http://localhost:8000/api/v1/faq/${editingId}` : "http://localhost:8000/api/v1/faq/";
      await axios({
        method: editingId ? "put" : "post",
        url,
        data: formData, // No FormData needed here, standard JSON is fine
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push("/admin/faq");
    } catch (err) { 
      alert("Error saving FAQ"); 
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
            <HelpCircle className="w-6 h-6 text-red-600" />
            {editingId ? "Edit FAQ" : "New FAQ"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? "Update the details of this frequently asked question." : "Create a new frequently asked question to help your customers."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Q&A Section */}
        <div className="space-y-6">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <MessageCircleQuestion className="w-4 h-4 text-red-500" /> 
              Question
            </label>
            <input 
              value={formData.question} 
              onChange={e => setFormData({...formData, question: e.target.value})} 
              className={inputClass} 
              placeholder="e.g. How long does shipping take?"
              required 
            />
          </div>
          
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <AlignLeft className="w-4 h-4 text-red-500" />
              Answer
            </label>
            <textarea 
              value={formData.answer} 
              onChange={e => setFormData({...formData, answer: e.target.value})} 
              className={`${inputClass} min-h-[160px] resize-y`} 
              placeholder="Provide a clear and concise answer here..."
              required 
            />
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Hash className="w-4 h-4 text-red-500" />
              Display Order
            </label>
            <input 
              type="number" 
              value={formData.display_order} 
              onChange={e => setFormData({...formData, display_order: e.target.value === "" ? 0 : parseInt(e.target.value)})} 
              className={inputClass} 
              placeholder="0"
            />
            <p className="mt-2 text-[11px] text-gray-400 font-medium italic">
              * Lower numbers appear first in the list.
            </p>
          </div>

          <div className="flex items-center justify-start sm:justify-center h-full pt-2 sm:pt-6">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.checked})} 
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
            {editingId ? "Update FAQ" : "Save FAQ"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddFAQPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <FAQFormContent />
    </Suspense>
  );
}