"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const router = useRouter();

  const fetchBanners = async () => {
    const res = await axios.get(
      "http://localhost:8000/api/v1/banners/"
    );
    setBanners(res.data);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this banner?")) return;
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:8000/api/v1/banners/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchBanners();
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <button
          onClick={() => router.push("/admin/banners/form")}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          ➕ Add Banner
        </button>
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-100 text-xs font-bold">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Order</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id} className="border-t">
                <td className="p-3">
                  <img
                    src={`http://localhost:8000${banner.image}`}
                    className="w-20 h-12 object-contain"
                  />
                </td>
                <td className="p-3 font-bold">{banner.display_order}</td>
                <td className="p-3 text-sm truncate max-w-xs">
                  {banner.url || "-"}
                </td>
                <td className="p-3 text-right space-x-3">
                  <button
                    onClick={() =>
                      router.push(`/admin/banners/form?id=${banner.id}`)
                    }
                    className="text-blue-600 font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-600 font-bold"
                  >
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
