"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:8000/api/v1/outlets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    fetchOutlets();
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Outlets</h1>
        <Link href="/admin/outlets/add" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
          + Add New Outlet
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Outlet Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {outlets.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{o.outlet_name}</div>
                    <div className="text-xs text-gray-500">ID: {o.id}</div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{o.city}, {o.state}</div>
                    <div className="text-xs text-gray-500 truncate w-40">{o.address}</div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{o.phone}</div>
                    <div className="text-xs text-gray-500">{o.email}</div>
                </td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${o.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {o.status ? "Active" : "Inactive"}
                    </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => router.push(`/admin/outlets/add?id=${o.id}`)} className="text-blue-600 font-bold hover:underline">Edit</button>
                    <button onClick={() => handleDelete(o.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}