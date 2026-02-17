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
  // Fetch Product
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
  // Add To Cart Logic
  // ================================
  const handleAddToCart = () => {
    if (!product) return;

    const existingCart = localStorage.getItem("cart");
    let cart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];

    const existingProductIndex = cart.findIndex(
      (item) => item.id === product.id
    );

    if (existingProductIndex > -1) {
      cart[existingProductIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    setQuantity(1);
    setShowCartModal(true); // Show modal instead of alert
  };

  // ================================
  // Loading State
  // ================================
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Product not found.
      </div>
    );
  }

  const totalPrice = product.price * quantity;
  const totalOriginalPrice = product.original_price
    ? product.original_price * quantity
    : null;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
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

      {/* Product Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">

        {/* Image */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {product.image ? (
            <img
              src={`http://localhost:8000${product.image}`}
              alt={product.name}
              className="w-full h-[400px] object-contain"
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-300">
              No Image
            </div>
          )}
        </div>

        {/* Details */}
        <div>

          {product.category && (
            <p className="text-sm text-gray-500 mb-2 capitalize">
              Category: {product.category}
            </p>
          )}

          <h1 className="text-4xl font-black text-slate-800 mb-4">
            {product.name}
          </h1>

          {product.description && (
            <p className="text-gray-600 mb-6">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-6">
            <div className="text-3xl font-black text-green-700">
              ₹{totalPrice}
            </div>

            {totalOriginalPrice && (
              <div className="text-lg text-gray-400 line-through">
                ₹{totalOriginalPrice}
              </div>
            )}

            {product.compare_price && (
              <div className="text-sm text-gray-500">
                MRP: ₹{product.compare_price}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setQuantity((prev) => Math.max(1, prev - 1))
                }
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold"
              >
                -
              </button>

              <div className="px-6 py-2 font-bold text-lg">
                {quantity}
              </div>

              <button
                onClick={() =>
                  setQuantity((prev) => prev + 1)
                }
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold"
              >
                +
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Total: ₹{totalPrice}
            </div>
          </div>

          {/* Add To Cart */}
          <button
            onClick={handleAddToCart}
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-lg"
          >
            Add to Cart
          </button>

        </div>
      </div>

      {/* ================================
          Cart Modal
         ================================ */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-2xl text-center">

            <h2 className="text-xl font-bold text-green-600 mb-6">
              🛒 Item added to cart
            </h2>

            <div className="flex flex-col gap-4">

              <button
                onClick={() => router.push("/user/cart")}
                className="py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Checkout
              </button>

              <button
                onClick={() => router.back()}
                className="py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
              >
                Continue Browsing
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}
