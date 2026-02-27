"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Award, 
  Hash, 
  Image as ImageIcon 
} from "lucide-react";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const router = useRouter();

  const fetchCertificates = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/certificates/"
      );
      setCertificates(res.data);
    } catch (error) {
      console.error("Failed to fetch certificates", error);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this certificate?")) return;
    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `http://localhost:8000/api/v1/certificates/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCertificates();
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
            <Award className="w-6 h-6 text-red-600" />
            Certificates
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage quality certifications and official documents shown on your site.</p>
        </div>
        <button
          onClick={() => router.push("/admin/certificates/form")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Certificate
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-32">Document</th>
                <th scope="col" className="px-6 py-4 font-medium">
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Display Order
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Award className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No certificates found. Add your first document!</p>
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white p-1 shadow-sm group-hover:border-red-200 transition-colors">
                        <img
                          src={`http://localhost:8000${cert.image}`}
                          alt="Certificate"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold text-xs border border-gray-200">
                        {cert.display_order}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/certificates/form?id=${cert.id}`)
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Certificate"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Certificate"
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