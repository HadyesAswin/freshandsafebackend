"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyListPage() {
  const [policies, setPolicies] = useState([]);
  const router = useRouter();

  const fetchPolicies = async () => {
    const res = await axios.get("http://localhost:8000/api/v1/privacy/");
    setPolicies(res.data);
  };

  useEffect(() => { fetchPolicies(); }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Privacy Policies</h1>
        <Link href="/admin/privacy/add" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">
          + New Policy Section
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow border">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {policies.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm">{p.display_order}</td>
                <td className="px-6 py-4 font-semibold text-slate-700">{p.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.status ? "Public" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => router.push(`/admin/privacy/add?id=${p.id}`)} className="text-indigo-600 font-bold hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}