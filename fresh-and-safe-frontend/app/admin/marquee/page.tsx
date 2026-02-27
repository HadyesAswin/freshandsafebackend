"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MonitorPlay, MessageSquareQuote } from "lucide-react";

export default function MarqueeListPage() {
  const [marquees, setMarquees] = useState([]);
  const router = useRouter();

  const fetchMarquees = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/marquee/");
      setMarquees(res.data);
    } catch (error) {
      console.error("Failed to fetch marquees", error);
    }
  };

  useEffect(() => { fetchMarquees(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this marquee?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/marquee/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMarquees();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <MonitorPlay className="w-6 h-6 text-red-600" />
            Scrolling Marquee Text
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage the scrolling announcement bar on your website.</p>
        </div>
        <Link 
          href="/admin/marquee/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add New Marquee
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Current Text</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marquees.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center">
                    <MonitorPlay className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No announcements found. Add your first marquee!</p>
                  </td>
                </tr>
              ) : (
                marquees.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 max-w-3xl">
                         <div className="mt-0.5 flex-shrink-0">
                           <MessageSquareQuote className="w-4 h-4 text-red-400" />
                         </div>
                         <div className="text-gray-700 font-medium italic">
                           {m.text}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/marquee/add?id=${m.id}`)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Marquee"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Marquee"
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