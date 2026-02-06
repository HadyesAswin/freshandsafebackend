"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function BannerFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [displayOrder, setDisplayOrder] = useState(0);
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const isEdit = Boolean(id);

  // Load data if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/banners/")
      .then((res) => {
        const banner = res.data.find((b: any) => b.id === Number(id));
        if (banner) {
          setDisplayOrder(banner.display_order);
          setUrl(banner.url || "");
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("display_order", String(displayOrder));
    data.append("url", url);
    if (image) data.append("image", image);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/banners/${id}`
          : "http://localhost:8000/api/v1/banners/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/banners");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "✏️ Edit Banner" : "➕ Add Banner"}
      </h1>

      {message && <p className="text-red-600 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          required={!isEdit}
        />

        <input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
          className="border p-2 w-full rounded"
          placeholder="Display Order"
        />

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Redirect URL (optional)"
        />

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
