"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();

  const fetchProducts = async () => {
    const res = await axios.get(
      "http://localhost:8000/api/v1/products/"
    );
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:8000/api/v1/products/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchProducts();
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => router.push("/admin/products/form")}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          ➕ Add Product
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 text-xs font-bold">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3">
                  {product.image ? (
                    <img
                      src={`http://localhost:8000${product.image}`}
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 font-semibold">{product.name}</td>
                <td className="p-3 font-bold">
                  ₹{product.price}
                  {product.compare_price && (
                    <span className="text-xs text-gray-400 line-through ml-2">
                      ₹{product.compare_price}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {product.status ? "✅ Active" : "❌ Inactive"}
                </td>
                <td className="p-3 text-right space-x-3">
                  <button
                    onClick={() =>
                      router.push(`/admin/products/form?id=${product.id}`)
                    }
                    className="text-blue-600 font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
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
