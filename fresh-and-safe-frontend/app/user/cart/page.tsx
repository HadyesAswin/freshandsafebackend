"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}
  
export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  // ==========================================
  // Hybrid Load Logic (The Source of Truth)
  // ==========================================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedZip = localStorage.getItem("zipcode");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // ✅ LOGGED IN: Fetch from Database with Zipcode for Deal Prices
      const fetchUrl = `http://localhost:8000/api/v1/cart/${parsedUser.id}${storedZip ? `?zipcode=${storedZip}` : ''}`;
      
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((dbCart) => {
          setCart(dbCart);
          
          // ✅ CRITICAL FIX: Update localStorage with the clean database cart.
          // This prevents other pages from reading "ghost" items during "Add to Cart".
          localStorage.setItem("cart", JSON.stringify(dbCart));
          
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      // ✅ GUEST: Use localStorage
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
      setLoading(false);
    }
  }, []);

  // ==========================================
  // Hybrid Update Logic (Sync Everything)
  // ==========================================
  const updateCartStorage = async (updatedCart: CartItem[]) => {
    // 1. Update UI state immediately
    setCart(updatedCart);
    
    // 2. Update localStorage immediately (so all other pages see the current state)
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // ✅ LOGGED IN: Sync with Database
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: parsedUser.id,
            items: updatedCart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          }),
        });
      } catch (error) {
        console.error("Database sync failed:", error);
      }
    }
  };

  const increaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    updateCartStorage(updatedCart);
  };

  const decreaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    updateCartStorage(updatedCart);
  };

  const removeItem = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    updateCartStorage(updatedCart);
  };

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalTotal = subtotal - discount;

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponError("Enter coupon code");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/public-coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal: subtotal,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });
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

  const proceedToCheckout = () => {
    localStorage.setItem("checkout_discount", JSON.stringify({
      code: couponCode,
      amount: discount
    }));
    router.push("/user/checkout");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
        Refreshing your cart...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-green-600 hover:underline">
            Continue Shopping →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
          🛒 Your Cart {user && <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-tighter">Sync Active</span>}
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center shadow-sm border border-dashed border-gray-200">
            <p className="text-gray-400 mb-6 font-medium italic">Your cart is currently empty.</p>
            <Link href="/" className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {/* Item List */}
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm flex gap-6 border border-transparent hover:border-green-100 transition-colors group">
                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border p-2">
                    {item.image ? (
                      <img src={`http://localhost:8000${item.image}`} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="text-[10px] text-gray-300 font-bold uppercase">No Image</div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">{item.name}</h2>
                      <p className="text-gray-400 text-xs mt-1 font-bold tracking-wide">₹{item.price} per unit</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-50 border rounded-lg overflow-hidden">
                        <button onClick={() => decreaseQuantity(item.id)} className="px-3 py-1 hover:bg-white font-black text-slate-600 transition-colors">-</button>
                        <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)} className="px-3 py-1 hover:bg-white font-black text-slate-600 transition-colors">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 text-[10px] font-black uppercase hover:text-red-600 transition-colors tracking-widest">
                        Remove Item
                      </button>
                    </div>
                  </div>

                  <div className="text-xl font-black text-slate-800 self-center">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm h-fit border sticky top-24">
              <h2 className="text-lg font-black mb-6 text-slate-800 uppercase tracking-widest">Summary</h2>
              
              <div className="mb-8">
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Promo Code" className="flex-1 border bg-gray-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 font-bold" />
                  <button onClick={handleApplyCoupon} className="bg-slate-800 text-white px-5 rounded-xl text-xs font-black hover:bg-black transition-colors uppercase">Apply</button>
                </div>
                {couponError && <div className="text-red-500 text-[10px] mt-2 font-black uppercase">{couponError}</div>}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 text-sm font-bold"><span>Subtotal</span><span className="text-slate-800">₹{subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600 text-sm font-black"><span>Discount</span><span>- ₹{discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-gray-500 text-sm font-bold"><span>Delivery</span><span className="text-green-600">FREE</span></div>
              </div>

              <div className="border-t border-dashed pt-6 flex justify-between text-2xl font-black text-slate-900 mb-8">
                <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <button onClick={proceedToCheckout} className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 text-lg">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}