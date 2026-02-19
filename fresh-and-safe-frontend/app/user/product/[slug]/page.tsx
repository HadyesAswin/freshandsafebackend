"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  price: number;
  original_price?: number | null;
  compare_price?: number | null;
  unit?: string;
  category?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showCartModal, setShowCartModal] = useState(false);

  // ================================
  // Fetch Product Data
  // ================================
  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");

    if (!storedZip) {
      router.push("/");
      return;
    }

    setZipcode(storedZip);

    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/location-products/product/${slug}?zipcode=${storedZip}`
        );

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, router]);

  // ================================
  // ✅ FIXED: Hybrid Add To Cart Logic
  // ================================
  const handleAddToCart = async () => {
    if (!product) return;

    // 1. CRITICAL: Always get the FRESH local cart right now.
    // This ensures we don't use an old version that still has removed items.
    const existingCart = localStorage.getItem("cart");
    let currentCart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];

    const existingProductIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex > -1) {
      currentCart[existingProductIndex].quantity += quantity;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
      });
    }

    // 2. Save the cleaned/updated cart back to localStorage immediately
    localStorage.setItem("cart", JSON.stringify(currentCart));

    // 3. Sync with Database if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            // Syncing the full cleaned list ensures the DB is an exact match
            items: currentCart.map((i) => ({ 
                product_id: i.id, 
                quantity: i.quantity 
            })),
          }),
        });
      } catch (error) {
        console.error("Database sync failed:", error);
      }
    }

    setQuantity(1);
    setShowCartModal(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 font-bold">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 font-bold">
        Product not found.
      </div>
    );
  }

  const sellingPrice = product.price;
  const totalPrice = sellingPrice * quantity;
  const strikethroughPrice = product.original_price || product.compare_price;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>

          {zipcode && (
            <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-bold">
              📍 {zipcode}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border flex items-center justify-center">
          {product.image ? (
            <img
              src={`http://localhost:8000${product.image}`}
              alt={product.name}
              className="w-full h-auto max-h-[450px] object-contain hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest">
              No Image
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-center">
          {product.category && (
            <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-widest border border-green-100">
              {product.category}
            </span>
          )}

          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 leading-tight">
            {product.name}
          </h1>

          {product.description && (
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mb-8">
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-green-700">₹{sellingPrice}</span>
              {strikethroughPrice && (
                <span className="text-xl text-gray-300 line-through font-bold">
                  ₹{strikethroughPrice}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-bold">Inclusive of all taxes</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-5 py-3 hover:bg-white text-xl font-black transition-colors"
                >
                  -
                </button>
                <div className="px-6 py-3 font-black text-xl w-16 text-center">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-5 py-3 hover:bg-white text-xl font-black transition-colors"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Subtotal</p>
                <p className="text-2xl font-black text-slate-800">₹{totalPrice}</p>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-xl shadow-green-100"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-10 w-full max-w-sm shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Added to Cart!</h2>
            <p className="text-gray-500 mb-8 font-medium">Your selection has been updated.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/user/cart")}
                className="py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg"
              >
                Go to Cart & Checkout
              </button>

              <button
                onClick={() => setShowCartModal(false)}
                className="py-3 bg-white text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition border border-gray-100"
              >
                Keep Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}