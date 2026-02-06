"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Fetch certificates
  const fetchCertificates = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/certificates/");
      setCertificates(res.data);
    } catch (err) {
      console.error("Failed to load certificates", err);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("display_order", String(displayOrder));
    if (selectedFile) data.append("image", selectedFile);

    try {
      const url = editingId
        ? `http://localhost:8000/api/v1/certificates/${editingId}`
        : "http://localhost:8000/api/v1/certificates/";

      const method = editingId ? "put" : "post";

      await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(editingId ? "✅ Certificate updated!" : "✅ Certificate added!");

      // Reset form
      setSelectedFile(null);
      setDisplayOrder(0);
      setEditingId(null);

      fetchCertificates();
    } catch (err: any) {
      console.error(err);
      setMessage("❌ Error: " + (err.response?.data?.detail || "Action failed"));
    }
  };

  const handleEdit = (cert: any) => {
    setEditingId(cert.id);
    setDisplayOrder(cert.display_order || 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this certificate?")) return;
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://localhost:8000/api/v1/certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCertificates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Certificates
      </h1>

      {/* ---- FORM ---- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? "✏️ Edit Certificate" : "➕ Add Certificate"}
        </h2>

        {message && <p className="mb-4 font-bold text-sm">{message}</p>}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">
              Certificate Image
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="border p-1 rounded text-sm"
              accept="image/*"
              required={!editingId}
            />
          </div>

          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            placeholder="Display Order"
            className="border p-2 rounded"
          />

          <div className="md:col-span-2 flex space-x-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
            >
              {editingId ? "Update" : "Save Certificate"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDisplayOrder(0);
                  setSelectedFile(null);
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ---- TABLE ---- */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {certificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <img
                    src={`http://localhost:8000${cert.image}`}
                    alt="Certificate"
                    className="w-14 h-14 object-contain rounded border shadow-sm"
                  />
                </td>

                <td className="px-6 py-4 font-bold">
                  {cert.display_order}
                </td>

                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(cert)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="text-red-600 font-bold hover:underline"
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
