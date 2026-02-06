"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FAQListPage() {
  const [faqs, setFaqs] = useState([]);
  const router = useRouter();

  const fetchFaqs = async () => {
    const res = await axios.get("http://localhost:8000/api/v1/faq/");
    setFaqs(res.data);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this FAQ?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:8000/api/v1/faq/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchFaqs();
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage FAQs</h1>
        <Link href="/admin/faq/add" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md">
          + Add FAQ
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Question</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {faqs.map((faq: any) => (
              <tr key={faq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{faq.display_order}</td>
                <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{faq.question}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${faq.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {faq.status ? "Active" : "Hidden"}
                    </span>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => router.push(`/admin/faq/add?id=${faq.id}`)} className="text-blue-600 font-bold hover:underline">Edit</button>
                  <button onClick={() => handleDelete(faq.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}