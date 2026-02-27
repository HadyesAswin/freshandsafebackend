"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Scale, FileText } from "lucide-react";

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
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/termsandconditions/"
      );
      setTerms(res.data);
    } catch (error) {
      console.error("Failed to fetch terms", error);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete these terms?")) return;

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `http://localhost:8000/api/v1/termsandconditions/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTerms();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const truncate = (text: string, length = 120) =>
    text.length > length ? text.slice(0, length) + "…" : text;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-red-600" />
            Terms & Conditions
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage the legal policies and terms of service for your platform.</p>
        </div>

        <button
          onClick={() => router.push("/admin/termsandconditions/form")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Terms
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-48">Title</th>
                <th scope="col" className="px-6 py-4 font-medium">Description</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {terms.length > 0 ? (
                terms.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-gray-900">{item.title}</div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="text-sm text-gray-500 max-w-2xl italic">
                        {truncate(item.description || "")}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-start justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/termsandconditions/form?id=${item.id}`
                            )
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Terms"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Terms"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No terms or policies added yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}