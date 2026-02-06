"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const router = useRouter();

  // Fetch Refund Policies
  const fetchPolicies = async () => {
    const res = await axios.get(
      "http://localhost:8000/api/v1/refund-policy/"
    );
    setPolicies(res.data);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Delete Refund Policy
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this refund policy?")) return;

    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:8000/api/v1/refund-policy/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchPolicies();
  };

  const truncate = (text: string, length = 120) => {
    if (!text) return "";
    return text.length > length ? text.slice(0, length) + "…" : text;
  };

  const headers = ["Title", "Description", "Status", "Actions"];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Refund Policy</h1>
        <button
          onClick={() => router.push("/admin/refundpolicy/form")}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          ➕ Add Policy
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          {/* ---------- TABLE HEADER ---------- */}
          <thead className="bg-gray-100 text-xs font-bold">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className={`p-3 ${h === "Actions" ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* ---------- TABLE BODY ---------- */}
          <tbody>
            {policies.map((item) => (
              <tr key={item.id} className="border-t align-top">
                <td className="p-3 font-semibold whitespace-nowrap">
                  {item.title}
                </td>

                <td className="p-3 text-sm text-gray-700 max-w-xl">
                  {truncate(item.description)}
                </td>

                <td className="p-3 whitespace-nowrap">
                  {item.status ? "✅ Active" : "❌ Inactive"}
                </td>

                <td className="p-3 text-right space-x-3 whitespace-nowrap">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/refundpolicy/form?id=${item.id}`
                      )
                    }
                    className="text-blue-600 font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {policies.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No refund policies added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
