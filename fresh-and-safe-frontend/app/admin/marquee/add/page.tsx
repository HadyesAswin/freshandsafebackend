"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  MonitorPlay, 
  Save, 
  Loader2, 
  MessageSquareText 
} from "lucide-react";

function MarqueeFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/marquee/").then(res => {
        const item = res.data.find((x: any) => x.id === parseInt(editingId));
        if (item) setText(item.text);
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const url = editingId ? `http://localhost:8000/api/v1/marquee/${editingId}` : "http://localhost:8000/api/v1/marquee/";
      await axios({ 
        method: editingId ? "put" : "post", 
        url, 
        data: { text }, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      router.push("/admin/marquee");
    } catch (err) { 
      alert("Error saving marquee"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Reusable styling classes
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-4";
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
            <MonitorPlay className="w-6 h-6 text-red-600" />
            {editingId ? "Edit Marquee" : "New Marquee"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? "Update your scrolling announcement text." : "Create a new scrolling announcement for your website."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Input Section */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <MessageSquareText className="w-4 h-4 text-red-500" />
            Announcement Text
          </label>
          <div className="relative mt-2">
            <input 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="e.g. 🔥 Flash Sale! 10% Discount on all Frozen Fish this weekend! 🐟"
              className={inputClass} 
              required 
            />
          </div>
          <p className="mt-2 text-[11px] text-gray-400 font-medium italic">
            * Emojis are supported. Keep it brief and exciting!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
            {editingId ? "Update Marquee" : "Save Marquee"}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function AddMarqueePage() { 
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <MarqueeFormContent />
    </Suspense>
  ); 
}