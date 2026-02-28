"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin, Phone, Store } from "lucide-react";

export default function OutletListPage() {
  const [outlets, setOutlets] = useState([]);
  const router = useRouter();

  const fetchOutlets = async () => {
    const res = await axios.get("http://localhost:8000/api/v1/outlets/");
    setOutlets(res.data);
  };

  useEffect(() => { fetchOutlets(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this outlet?")) return;
    const token = localStorage.getItem("admin_token");
    await axios.delete(`http://localhost:8000/api/v1/outlets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    fetchOutlets();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Outlets</h1>
          <p className="text-sm text-gray-500 mt-1">View, edit, and manage your store locations.</p>
        </div>
        <Link 
          href="/admin/outlets/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add New Outlet
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Outlet Name</th>
                <th scope="col" className="px-6 py-4 font-medium">Location</th>
                <th scope="col" className="px-6 py-4 font-medium">Contact</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {outlets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                     <p className="text-sm text-gray-500 font-medium">No outlets found. Add one to get started!</p>
                  </td>
                </tr>
              ) : (
                outlets.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 hidden sm:block group-hover:bg-white transition-colors">
                          <Store className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{o.outlet_name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">ID: {o.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{o.city}, {o.state}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[160px]" title={o.address}>{o.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{o.phone}</div>
                          <div className="text-xs text-gray-500">{o.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        o.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {o.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/outlets/add?id=${o.id}`)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Outlet"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(o.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Outlet"
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