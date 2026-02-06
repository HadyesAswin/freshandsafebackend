"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

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
    const token = localStorage.getItem("token");
    try {
      const url = editingId ? `http://localhost:8000/api/v1/marquee/${editingId}` : "http://localhost:8000/api/v1/marquee/";
      await axios({ method: editingId ? "put" : "post", url, data: { text }, headers: { Authorization: `Bearer ${token}` } });
      router.push("/admin/marquee");
    } catch (err) { alert("Error saving marquee"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8 text-slate-800">{editingId ? "Edit Marquee" : "New Marquee"}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl space-y-6 border-t-4 border-amber-500">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Announcement Text</label>
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="e.g. 10% Discount on all Frozen Fish this weekend!"
            className="w-full border-2 p-4 rounded-lg focus:border-amber-500 outline-none" 
            required 
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 shadow-lg transition-transform active:scale-95">
          {loading ? "Saving..." : "Update Marquee"}
        </button>
      </form>
    </div>
  );
}

export default function AddMarqueePage() { return <Suspense><MarqueeFormContent /></Suspense>; }