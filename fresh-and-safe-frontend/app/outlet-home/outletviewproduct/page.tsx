"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function OutletViewProduct() {
  const [products, setProducts] = useState<any[]>([]);
  const outletId = typeof window !== "undefined"
    ? localStorage.getItem("outlet_id")
    : null;

  useEffect(() => {
    if (outletId) {
      fetchProducts();
    }
  }, [outletId]);

  const fetchProducts = async () => {
    const res = await axios.get(
    `http://192.168.1.7:8000/api/v1/outlet/products/${outletId}`
  );
    setProducts(res.data);
  };

  const handleToggle = async (productId: number) => {
    await axios.post(
      "http://192.168.1.7:8000/api/v1/outlet/products/toggle",
      null,
      {
        params: {
          outlet_id: outletId,
          product_id: productId,
        },
      }
    );

    fetchProducts(); // refresh list
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Manage Outlet Products
      </h1>

      <div className="space-y-4">
        {products.map((product) => (
          <div
  key={product.id}
  className="bg-white p-6 rounded shadow space-y-2"
>
  {product.image && (
    <img
  src={`http://192.168.1.7:8000${product.image}`}
  alt={product.name}
  className="w-32 h-32 object-cover rounded"
/>
  )}

  <h2 className="text-lg font-bold">{product.name}</h2>

  <p className="text-sm text-gray-500">
    Slug: {product.slug}
  </p>

  <p className="text-gray-700">
    {product.description}
  </p>

  <div className="flex gap-4">
    <p className="text-green-600 font-semibold">
      ₹{product.price}
    </p>

    {product.compare_price && (
      <p className="line-through text-gray-400">
        ₹{product.compare_price}
      </p>
    )}
  </div>

  <p className="text-sm">
    Unit: {product.unit}
  </p>

  <p className="text-sm">
    Category: {product.category_name}
  </p>

  <p className="text-xs text-gray-400">
    Created: {new Date(product.created_at).toLocaleDateString()}
  </p>

  <button
    onClick={() => handleToggle(product.id)}
    className={`px-4 py-2 rounded text-white ${
      product.is_enabled
        ? "bg-green-600"
        : "bg-gray-400"
    }`}
  >
    {product.is_enabled ? "ON" : "OFF"}
  </button>
</div>

        ))}
      </div>
    </div>
  );
}
