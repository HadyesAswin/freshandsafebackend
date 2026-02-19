"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const router = useRouter();

  const fetchTestimonials = async () => {
    const res = await axios.get(
      "http://localhost:8000/api/v1/testimonials/"
    );
    setTestimonials(res.data);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;

    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:8000/api/v1/testimonials/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchTestimonials();
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <button
          onClick={() => router.push("/admin/testimonials/form")}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          ➕ Add Testimonial
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 text-xs font-bold">
            <tr>
              <th className="p-3">Photo</th>
              <th className="p-3">Name</th>
              <th className="p-3">Place</th>
              <th className="p-3">Description</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {testimonials.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  {item.photo ? (
                    <img
                      src={`http://localhost:8000${item.photo}`}
                      className="w-16 h-16 object-cover rounded-full"
                    />
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3 font-semibold">{item.name}</td>

                <td className="p-3">{item.place || "-"}</td>

                {/* ✅ DESCRIPTION COLUMN */}
                <td className="p-3 max-w-xs">
                  <p
                    className="truncate"
                    title={item.description} // hover to see full
                  >
                    {item.description}
                  </p>
                </td>

                {/* ✅ STATUS COLUMN MOVED CORRECTLY */}
                <td className="p-3">
                  {item.status ? "✅ Active" : "❌ Inactive"}
                </td>

                <td className="p-3 text-right space-x-3">
                  <button
                    onClick={() =>
                      router.push(`/admin/testimonials/form?id=${item.id}`)
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
