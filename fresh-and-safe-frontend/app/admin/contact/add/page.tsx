"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function ContactFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", email: "", phone: "", description: "" });

  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/contact/").then(res => {
        const item = res.data.find((x: any) => x.id === parseInt(editingId));
        if (item) setFormData({ title: item.title, email: item.email, phone: item.phone, description: item.description });
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const url = editingId ? `http://localhost:8000/api/v1/contact/${editingId}` : "http://localhost:8000/api/v1/contact/";
      await axios({ method: editingId ? "put" : "post", url, data: formData, headers: { Authorization: `Bearer ${token}` } });
      router.push("/admin/contact");
    } catch (err) { alert("Error saving contact details"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8 text-slate-800">{editingId ? "Update Contact Info" : "Add Contact Info"}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700">Branch/Office Title</label>
          <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded" placeholder="e.g. Main HQ" required />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Email Address</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-3 rounded" placeholder="support@fresh.com" required />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Phone Number</label>
          <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-3 rounded" placeholder="+123 456 789" required />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Additional Info / Address</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded h-24" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow">
          {loading ? "Saving..." : "Save Contact Info"}
        </button>
      </form>
    </div>
  );
}

export default function AddContactPage() { return <Suspense><ContactFormContent /></Suspense>; }