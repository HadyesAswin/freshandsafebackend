"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CategoriesListPage() {
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Categories</h1>
        {/* REDIRECT TO ADD PAGE */}
        <Link 
          href="/admin/categories/add" 
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md"
        >
          ➕ Add New Category
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat: any) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {cat.image ? (
                    <img 
                      src={`http://localhost:8000${cat.image}`} 
                      alt={cat.name} 
                      className="w-12 h-12 object-cover rounded shadow-sm border" 
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{cat.name}</div>
                  <div className="text-xs text-gray-500">{cat.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${cat.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cat.status ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button 
                    onClick={() => router.push(`/admin/categories/add?id=${cat.id}`)} 
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 font-bold hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}