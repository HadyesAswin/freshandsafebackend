"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function RefundPolicyFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [message, setMessage] = useState("");

  // Load policy if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/refund-policy/")
      .then((res) => {
        const item = res.data.find((p: any) => p.id === Number(id));
        if (item) {
          setTitle(item.title);
          setDescription(item.description);
          setStatus(item.status);
        }
      })
      .catch(() => {
        setMessage("Failed to load refund policy");
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("status", String(status));

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/refund-policy/${id}`
          : "http://localhost:8000/api/v1/refund-policy/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push("/admin/refundpolicy");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "✏️ Edit Refund Policy" : "➕ Add Refund Policy"}
      </h1>

      {message && <p className="text-red-600 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Title"
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full rounded min-h-[200px]"
          placeholder="Refund policy description"
          required
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
