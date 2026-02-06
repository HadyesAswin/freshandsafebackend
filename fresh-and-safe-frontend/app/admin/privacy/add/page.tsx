"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function PrivacyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", display_order: 0, status: true });

  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/privacy/").then(res => {
        const item = res.data.find((x: any) => x.id === parseInt(editingId));
        if (item) setFormData({ title: item.title, description: item.description, display_order: item.display_order, status: item.status });
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const url = editingId ? `http://localhost:8000/api/v1/privacy/${editingId}` : "http://localhost:8000/api/v1/privacy/";
      await axios({ method: editingId ? "put" : "post", url, data: formData, headers: { Authorization: `Bearer ${token}` } });
      router.push("/admin/privacy");
    } catch (err) { alert("Error saving policy"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8 text-slate-800">{editingId ? "Edit Policy Section" : "New Policy Section"}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Section Title</label>
          <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Policy Description / Content</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded-lg h-64 focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <div className="flex items-center space-x-8">
           <div className="flex-1">
             <label className="block text-sm font-bold text-slate-700 mb-1">Display Order</label>
             <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} className="w-full border p-3 rounded-lg" />
           </div>
           <div className="flex items-center pt-6 space-x-2">
             <input type="checkbox" checked={formData.status} onChange={e => setFormData({...formData, status: e.target.checked})} className="h-6 w-6 text-indigo-600 rounded" />
             <span className="font-semibold text-slate-700">Active</span>
           </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg">
          {loading ? "Processing..." : "Save Policy Section"}
        </button>
      </form>
    </div>
  );
}

export default function AddPrivacyPage() { return <Suspense><PrivacyFormContent /></Suspense>; }