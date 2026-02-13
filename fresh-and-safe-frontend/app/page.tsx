"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [zipcode, setZipcode] = useState("");
  const [savedZipcode, setSavedZipcode] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load zipcode from localStorage
  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");

    if (!storedZip) {
      setShowModal(true);
    } else {
      setSavedZipcode(storedZip);
    }
  }, []);

  // Fetch products when zipcode changes
  useEffect(() => {
    if (!savedZipcode) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/location-products?zipcode=${savedZipcode}`
        );

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.detail || "Failed to fetch products"
          );
        }

        const data = await response.json();

        // Validate response structure
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format from server");
        }

        setProducts(data);
      } catch (err: any) {
        console.error("Fetch error:", err.message);
        setProducts([]);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [savedZipcode]);

  const handleSubmit = () => {
    if (zipcode.length !== 6) return;

    localStorage.setItem("zipcode", zipcode);
    setSavedZipcode(zipcode);
    setShowModal(false);
  };

  const openModalToEdit = () => {
    setZipcode(savedZipcode || "");
    setShowModal(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans relative">

      {/* ZIPCODE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-96 relative text-center">

            {savedZipcode && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            )}

            <h2 className="text-2xl font-bold mb-4">
              Enter Your Zip Code
            </h2>

            <input
              type="text"
              value={zipcode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setZipcode(value);
              }}
              maxLength={6}
              inputMode="numeric"
              placeholder="Enter 6-digit Zip Code"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {zipcode.length > 0 && zipcode.length < 6 && (
              <p className="text-red-500 text-sm mb-2">
                Zip code must be exactly 6 digits
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={zipcode.length !== 6}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                zipcode.length === 6
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-green-600 tracking-tight">
            Fresh<span className="text-gray-800">&Safe</span>
          </div>

          {savedZipcode && (
            <button
              onClick={openModalToEdit}
              className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-green-200 transition"
            >
              📍 {savedZipcode}
            </button>
          )}
        </div>

        <div className="space-x-6 text-sm font-medium">
          <Link href="/login" className="text-gray-600 hover:text-green-600 transition">
            Log In
          </Link>
          <Link href="/shop-login" className="text-gray-600 hover:text-green-600 transition">
            Shop Login
          </Link>
        </div>
      </nav>

      {/* Products Section */}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Products Near You
        </h1>

        {loading && (
          <p className="text-center text-gray-500">
            Loading products...
          </p>
        )}

        {error && (
          <p className="text-center text-red-500">
            {error}
          </p>
        )}

        {!loading && !error && products.length === 0 && savedZipcode && (
          <p className="text-center text-gray-500">
            No products available in your area.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition"
            >
              {product.image && (
                <img
                  src={`http://192.168.1.7:8000${product.image}`}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded mb-4"
                />
              )}
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-green-600 font-bold mt-2">
                ₹ {product.price}
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
