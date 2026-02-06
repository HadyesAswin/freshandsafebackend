"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

type Term = {
  id: number;
  title: string;
  description?: string;
  status: boolean;
};

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const router = useRouter();

  const fetchTerms = async () => {
    const res = await axios.get(
      "http://localhost:8000/api/v1/termsandconditions/"
    );
    setTerms(res.data);
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete these terms?")) return;

    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:8000/api/v1/termsandconditions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchTerms();
  };

  const truncate = (text: string, length = 120) =>
    text.length > length ? text.slice(0, length) + "…" : text;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Terms & Conditions</h1>

        <button
          onClick={() => router.push("/admin/termsandconditions/form")}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          ➕ Add Terms
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-xs font-bold">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {terms.length > 0 ? (
              terms.map((item) => (
                <tr key={item.id} className="border-t align-top">
                  <td className="p-3 font-semibold whitespace-nowrap">
                    {item.title}
                  </td>

                  <td className="p-3 text-sm text-gray-700 max-w-xl">
                    {truncate(item.description || "")}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {item.status ? "✅ Active" : "❌ Inactive"}
                  </td>

                  <td className="p-3 text-right whitespace-nowrap space-x-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/termsandconditions/form?id=${item.id}`
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
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-400"
                >
                  No terms added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
