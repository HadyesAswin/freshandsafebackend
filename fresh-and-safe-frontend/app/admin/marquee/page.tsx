"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MarqueeListPage() {
  const [marquees, setMarquees] = useState([]);
  const router = useRouter();

  const fetchMarquees = async () => {
    const res = await axios.get("http://localhost:8000/api/v1/marquee/");
    setMarquees(res.data);
  };

  useEffect(() => { fetchMarquees(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this marquee?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:8000/api/v1/marquee/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchMarquees();
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Scrolling Marquee Text</h1>
        <Link href="/admin/marquee/add" className="bg-amber-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-600">
          + Add New Marquee
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow border">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Current Text</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {marquees.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                   <div className="bg-slate-100 p-2 rounded text-slate-700 italic border-l-4 border-amber-500">
                     "{m.text}"
                   </div>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => router.push(`/admin/marquee/add?id=${m.id}`)} className="text-amber-600 font-bold hover:underline">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}