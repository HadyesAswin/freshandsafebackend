"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, BookOpen, Calendar, Image as ImageIcon, CheckCircle2, FileText } from "lucide-react";

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const router = useRouter();

  const fetchBlogs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/admin/blogs/");
      setBlogs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/admin/blogs/${id}`);
      fetchBlogs();
    } catch (err) { alert("Failed to delete"); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" /> Blog Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage recipes, health tips, and articles.</p>
        </div>
        <Link href="/admin/blogs/add" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 shadow-sm active:scale-[0.98]">
          <Plus className="w-4 h-4" /> New Blog Post
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
            <tr>
              <th className="px-6 py-4 w-32">Thumbnail</th>
              <th className="px-6 py-4">Title / Author</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {blogs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No blogs found.</td></tr>
            ) : (
              blogs.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-16 h-10 rounded border overflow-hidden">
                      <img src={`http://localhost:8000${item.feature_image}`} className="w-full h-full object-cover" alt="" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-400">By {item.author} • {new Date(item.published_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {item.status ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => router.push(`/admin/blogs/add?id=${item.id}`)} className="p-2 text-gray-400 hover:text-red-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}