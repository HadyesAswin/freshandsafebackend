"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

// ---------- Helper ----------
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export default function ProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [price, setPrice] = useState<number | "">("");
  const [comparePrice, setComparePrice] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const [message, setMessage] = useState("");

  // Load categories
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/v1/categories/")
      .then((res) => setCategories(res.data));
  }, []);

  // Load product if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/products/")
      .then((res) => {
        const product = res.data.find((p: any) => p.id === Number(id));
        if (product) {
          setCategoryId(product.category_id);
          setName(product.name);
          setSlug(product.slug);
          setSlugTouched(true); // prevent auto overwrite on edit
          setPrice(product.price);
          setComparePrice(product.compare_price || "");
          setUnit(product.unit || "");
          setDescription(product.description || "");
          setStatus(product.status);
          setIsAvailable(product.is_available);
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("category_id", String(categoryId));
    data.append("name", name);
    data.append("slug", slug);
    data.append("price", String(price));
    if (comparePrice !== "") data.append("compare_price", String(comparePrice));
    data.append("unit", unit);
    data.append("description", description);
    data.append("status", String(status));
    data.append("is_available", String(isAvailable));
    if (image) data.append("image", image);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/products/${id}`
          : "http://localhost:8000/api/v1/products/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/products");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "✏️ Edit Product" : "➕ Add Product"}
      </h1>

      {message && <p className="text-red-600 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="border p-2 w-full rounded"
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          required={!isEdit}
        />

        {/* Product Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => {
            const value = e.target.value;
            setName(value);

            if (!slugTouched) {
              setSlug(generateSlug(value));
            }
          }}
          className="border p-2 w-full rounded"
          placeholder="Product Name"
          required
        />

        {/* Slug */}
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="border p-2 w-full rounded"
          placeholder="Slug"
          required
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="border p-2 w-full rounded"
          placeholder="Price"
          required
        />

        <input
          type="number"
          value={comparePrice}
          onChange={(e) => setComparePrice(e.target.valueAsNumber || "")}
          className="border p-2 w-full rounded"
          placeholder="Compare Price (optional)"
        />

        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Unit (e.g. kg, pcs)"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Description"
        />

        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            <span>Active</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <span>Available</span>
          </label>
        </div>

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
