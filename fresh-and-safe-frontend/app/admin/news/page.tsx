"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Newspaper, 
  Calendar, 
  Image as ImageIcon,
  CheckCircle2,
  FileText
} from "lucide-react";

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-red-600" />
            News & Articles
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your blog posts, announcements, and latest updates.</p>
        </div>
        <Link 
          href="/admin/news/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Write News
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-32">Thumbnail</th>
                <th scope="col" className="px-6 py-4 font-medium">Title / Published Date</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {newsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No articles found. Start writing your first post!</p>
                  </td>
                </tr>
              ) : (
                newsList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      {item.feature_image ? (
                        <div className="w-16 h-10 rounded border border-gray-200 overflow-hidden shadow-sm">
                          <img 
                            src={`http://localhost:8000${item.feature_image}`} 
                            className="w-full h-full object-cover" 
                            alt={item.title}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-10 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 line-clamp-1">{item.title}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {item.status ? (
                          <><CheckCircle2 className="w-3 h-3" /> Published</>
                        ) : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/news/add?id=${item.id}`)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Article"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Article"
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