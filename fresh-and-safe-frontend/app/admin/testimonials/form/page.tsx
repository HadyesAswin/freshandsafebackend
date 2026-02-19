"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function TestimonialFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [message, setMessage] = useState("");

  // Load testimonial for edit
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/testimonials/")
      .then((res) => {
        const item = res.data.find((t: any) => t.id === Number(id));
        if (item) {
          setName(item.name);
          setPlace(item.place || "");
          setDescription(item.description);
          setStatus(item.status);
          setDisplayOrder(item.display_order);
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("name", name);
    data.append("place", place);
    data.append("description", description);
    data.append("status", String(status));
    data.append("display_order", String(displayOrder));
    if (photo) data.append("photo", photo);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/testimonials/${id}`
          : "http://localhost:8000/api/v1/testimonials/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/testimonials");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "✏️ Edit Testimonial" : "➕ Add Testimonial"}
      </h1>

      {message && <p className="text-red-600 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          required={!isEdit}
        />

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Name"
          required
        />

        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Place"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Description"
          required
        />

        <input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
          className="border p-2 w-full rounded"
          placeholder="Display Order"
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={status}
            onChange={(e) => setStatus(e.target.checked)}
          />
          <span>Active</span>
        </label>

        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-6 py-2 rounded font-bold">
            {isEdit ? "Update" : "Save"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-400 text-white px-6 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
