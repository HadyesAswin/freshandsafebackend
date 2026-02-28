"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  ExternalLink, 
  Layout, 
  ArrowUpDown 
} from "lucide-react";

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const router = useRouter();

  const fetchBanners = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/banners/"
      );
      setBanners(res.data);
    } catch (error) {
      console.error("Failed to fetch banners", error);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this banner?")) return;
    const token = localStorage.getItem("admin_token");

    try {
      await axios.delete(
        `http://localhost:8000/api/v1/banners/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBanners();
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
            <Layout className="w-6 h-6 text-red-600" />
            Marketing Banners
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage the hero sliders and promotional images for your homepage.</p>
        </div>
        <button
          onClick={() => router.push("/admin/banners/form")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-40">Preview</th>
                <th scope="col" className="px-6 py-4 font-medium">
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> Order
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-medium">Redirect URL</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No banners found. Upload your first promotion!</p>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm group-hover:border-red-200 transition-colors">
                        <img
                          src={`http://localhost:8000${banner.image}`}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold text-xs border border-gray-200">
                        {banner.display_order}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {banner.url ? (
                        <div className="flex items-center gap-2 text-gray-600 max-w-xs">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate text-xs font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            {banner.url}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No redirect link</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/banners/form?id=${banner.id}`)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Banner"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Banner"
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