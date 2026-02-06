"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

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
    const token = localStorage.getItem("token");

    try {
      const url = editingId ? `http://localhost:8000/api/v1/faq/${editingId}` : "http://localhost:8000/api/v1/faq/";
      await axios({
        method: editingId ? "put" : "post",
        url,
        data: formData, // No FormData needed here, standard JSON is fine
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push("/admin/faq");
    } catch (err) { alert("Error saving FAQ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">{editingId ? "Edit FAQ" : "New FAQ"}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-bold mb-1">Question</label>
          <input value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} className="w-full border p-3 rounded" required />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Answer</label>
          <textarea value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} className="w-full border p-3 rounded h-40" required />
        </div>
        <div className="flex space-x-6">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-1">Display Order</label>
            <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} className="w-full border p-3 rounded" />
          </div>
          <div className="flex items-center pt-6 space-x-2">
            <input type="checkbox" checked={formData.status} onChange={e => setFormData({...formData, status: e.target.checked})} className="h-5 w-5" />
            <span className="font-semibold text-gray-700">Published</span>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700">
          {loading ? "Saving..." : "Save FAQ"}
        </button>
      </form>
    </div>
  );
}

export default function AddFAQPage() {
    return <Suspense><FAQFormContent /></Suspense>;
}