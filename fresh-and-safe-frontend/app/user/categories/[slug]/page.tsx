"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  slug: string;   // ✅ Added
  price: number;
  compare_price?: number;
  image?: string;
  unit?: string;
}

export default function CategoryProductPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);

  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");

    if (!storedZip) {
      router.push("/");
      return;
    }

    setZipcode(storedZip);

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/location-products/category/${slug}?zipcode=${storedZip}`
        );

        if (res.ok) {
          const data = await res.json();
          setCategoryName(data.category_name);
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Error loading category:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, router]);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">

      {/* --- HEADER --- */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>

          {zipcode && (
            <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-bold">
              📍 {zipcode}
            </div>
          )}
        </div>
      </header>

      {/* --- CONTENT --- */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-black font-medium transition"
          >
            ← Back
          </button>

          {!loading && (
            <h1 className="text-3xl font-bold text-slate-800 capitalize">
              {categoryName || slug}
            </h1>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
            Loading products...
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">🥬</div>
            <h2 className="text-xl font-bold text-gray-700">No products found.</h2>
            <p className="text-gray-500">
              We are currently out of stock for {categoryName} in your area.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              Browse other items
            </Link>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gray-50 overflow-hidden">
                {product.image ? (
                  <img
                    src={`http://localhost:8000${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5">
                <h3 className="font-bold text-gray-800 truncate mb-1 text-lg">
                  {product.name}
                </h3>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-black text-green-700">
                    ₹{product.price}
                  </span>

                  {product.compare_price && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.compare_price}
                    </span>
                  )}
                </div>

                {/* Navigate to Product Details Page */}
                <button
                  onClick={() =>
                    router.push(`/user/product/${product.slug}`)
                  }
                  className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-md text-sm"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
