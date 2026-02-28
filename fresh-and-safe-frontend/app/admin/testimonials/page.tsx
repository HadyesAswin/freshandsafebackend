"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  User, 
  MapPin, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const router = useRouter();

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/testimonials/"
      );
      setTestimonials(res.data);
    } catch (error) {
      console.error("Failed to fetch testimonials", error);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;

    const token = localStorage.getItem("admin_token");

    try {
      await axios.delete(
        `http://localhost:8000/api/v1/testimonials/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTestimonials();
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
            <MessageSquare className="w-6 h-6 text-red-600" />
            Testimonials
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer feedback and reviews shown on the website.</p>
        </div>
        <button
          onClick={() => router.push("/admin/testimonials/form")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-24">Photo</th>
                <th scope="col" className="px-6 py-4 font-medium">Customer</th>
                <th scope="col" className="px-6 py-4 font-medium">Location</th>
                <th scope="col" className="px-6 py-4 font-medium">Feedback</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No testimonials found. Add your first review!</p>
                  </td>
                </tr>
              ) : (
                testimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      {item.photo ? (
                        <img
                          src={`http://localhost:8000${item.photo}`}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-full border-2 border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-50">
                          <User className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {item.place || <span className="text-gray-300">Not specified</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <p
                        className="truncate text-gray-500 italic"
                        title={item.description}
                      >
                        "{item.description}"
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.status ? (
                          <><CheckCircle2 className="w-3 h-3" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Inactive</>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/testimonials/form?id=${item.id}`)
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Testimonial"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Testimonial"
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