"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  // ================================
  // Load Cart From localStorage
  // ================================
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    setLoading(false);
  }, []);

  // ================================
  // Update localStorage
  // ================================
  const updateCartStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // ================================
  // Increase Quantity
  // ================================
  const increaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    updateCartStorage(updatedCart);
  };

  // ================================
  // Decrease Quantity
  // ================================
  const decreaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    );
    updateCartStorage(updatedCart);
  };

  // ================================
  // Remove Item
  // ================================
  const removeItem = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    updateCartStorage(updatedCart);
  };

  // ================================
  // Calculate Totals
  // ================================
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const finalTotal = subtotal - discount;

  // ================================
  // Apply Coupon
  // ================================
  const handleApplyCoupon = async () => {
    setCouponError("");

    if (!couponCode.trim()) {
      setCouponError("Enter coupon code");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:8000/api/v1/public-coupons/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: couponCode,
            subtotal: subtotal,
            product_ids: cart.map((item) => item.id),
          }),
        }
      );

      const data = await res.json();

      if (data.valid) {
        setDiscount(data.discount);
      } else {
        setDiscount(0);
        setCouponError(data.message);
      }

    } catch (error) {
      setCouponError("Error validating coupon");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading cart...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-green-600 hover:underline"
          >
            Continue Shopping →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">

        <h1 className="text-3xl font-black text-slate-800 mb-8">
          🛒 Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center shadow-sm">
            <p className="text-gray-500 mb-6">Your cart is empty.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">

            {/* Cart Items */}
            <div className="md:col-span-2 space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl shadow-sm flex gap-6"
                >
                  {/* Image */}
                  <div className="w-28 h-28 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img
                        src={`http://localhost:8000${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800">
                      {item.name}
                    </h2>

                    <p className="text-gray-500 mb-4">
                      ₹{item.price} × {item.quantity}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold"
                      >
                        -
                      </button>

                      <span className="font-bold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-6 text-red-500 text-sm font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-lg font-black text-green-700">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {/* Coupon Section */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-green-600 text-white px-4 rounded text-sm font-semibold hover:bg-green-700"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <div className="text-red-500 text-xs mt-2">
                    {couponError}
                  </div>
                )}
              </div>

              <div className="flex justify-between mb-3">
                <span>Subtotal</span>
                <span className="font-bold">₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between mb-3 text-green-600">
                  <span>Discount</span>
                  <span>- ₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between mb-6 text-sm text-gray-500">
                <span>Delivery</span>
                <span>Free</span>
              </div>

              <div className="border-t pt-4 flex justify-between text-lg font-black">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>

              <button className="w-full mt-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">
                Proceed to Checkout
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
