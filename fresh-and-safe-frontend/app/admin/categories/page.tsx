"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";

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
    const token = localStorage.getItem("admin_token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your products into easy-to-navigate categories.</p>
        </div>
        <Link 
          href="/admin/categories/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-24">Image</th>
                <th scope="col" className="px-6 py-4 font-medium">Details</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                     <p className="text-sm text-gray-500 font-medium">No categories found. Add one to get started!</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat: any) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      {cat.image ? (
                        <img 
                          src={`http://localhost:8000${cat.image}`} 
                          alt={cat.name} 
                          className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-200" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{cat.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 tracking-wide">{cat.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        cat.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {cat.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/categories/add?id=${cat.id}`)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}