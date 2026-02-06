"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewsListPage() {
  const [newsList, setNewsList] = useState([]);
  const router = useRouter();

  const fetchNews = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/news/");
      setNewsList(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchNews(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this news article?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNews();
    } catch (err) { alert("Failed to delete"); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">News & Articles</h1>
        <Link href="/admin/news/add" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md">
          ✍️ Write News
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Title / Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {newsList.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {item.feature_image ? (
                    <img src={`http://localhost:8000${item.feature_image}`} className="w-16 h-10 object-cover rounded border" />
                  ) : <div className="w-16 h-10 bg-gray-200 rounded" />}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{item.title}</div>
                  <div className="text-xs text-gray-500">{new Date(item.published_at).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.status ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => router.push(`/admin/news/add?id=${item.id}`)} className="text-blue-600 font-bold hover:underline">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}