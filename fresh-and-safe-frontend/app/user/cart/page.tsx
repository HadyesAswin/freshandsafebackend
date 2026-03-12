"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, AlertCircle } from "lucide-react"; 

interface CartItem {
  id: number;
  name: string;
  slug: string; 
  price: number;
  image?: string;
  quantity: number;
  unit?: string; 
  is_available?: boolean;
}
  
export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const calculateTotalWeight = (qty: number, unitStr: string | undefined) => {
    if (!unitStr) return "";
    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/); 
    const unitValue = match ? parseFloat(match[0]) : 1;

    if (unit.includes("g") && !unit.includes("k")) {
      const totalG = qty * unitValue;
      return totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
    }
    if (unit.includes("kg")) return `${(qty * unitValue).toFixed(1)}kg`;
    if (unit.includes("pc") || unit.includes("piece")) return `${qty * unitValue} Pieces`;

    return `${qty * unitValue} ${unitStr}`;
  };

  const fetchCartData = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    const storedZip = localStorage.getItem("zipcode");
    const storedCart = localStorage.getItem("cart");
    const localCart = storedCart ? JSON.parse(storedCart) : [];

    console.log("🛒 [FRONTEND] Entering Cart Page...");
    console.log(`📍 [FRONTEND] Current Stored Zipcode is: '${storedZip}'`);

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      let fetchUrl = `http://localhost:8000/api/v1/cart/${parsedUser.id}`;
      if (storedZip && storedZip !== "undefined") {
          fetchUrl += `?zipcode=${storedZip}`;
      }
      
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((dbCart) => {
          const validCart = Array.isArray(dbCart) ? dbCart : [];
          if (validCart.length === 0 && localCart.length > 0) {
             updateCartStorage(localCart, parsedUser);
          } else {
             setCart(validCart);
             localStorage.setItem("cart", JSON.stringify(validCart));
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("❌ [FRONTEND] Cart fetch error:", err);
          setLoading(false);
        });
    } else {
      console.log("👤 [FRONTEND] Guest user detected. Validating local cart with backend...");
      if (localCart.length > 0) {
        fetch(`http://localhost:8000/api/v1/cart/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zipcode: storedZip,
            items: localCart
          })
        })
        .then(res => res.json())
        .then(validatedCart => {
          const validCart = Array.isArray(validatedCart) ? validatedCart : [];
          setCart(validCart);
          localStorage.setItem("cart", JSON.stringify(validCart));
          setLoading(false);
        })
        .catch(err => {
          console.error("❌ [FRONTEND] Guest cart validation error:", err);
          setCart(localCart);
          setLoading(false);
        });
      } else {
        setCart([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCartData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zipcode') {
        console.log(`🔄 [FRONTEND] Zipcode change detected in storage! Triggering cart reload...`);
        setLoading(true);
        fetchCartData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchCartData]); 

  const updateCartStorage = async (updatedCart: CartItem[], specificUser?: any) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    
    const activeUser = specificUser || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null);
    
    if (activeUser) {
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: activeUser.id,
            items: updatedCart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          }),
        });
      } catch (error) {
        console.error("Database sync failed:", error);
      }
    }
  };

  // ✅ FIX: Function to reset coupon when cart is manipulated
  const handleCartModification = () => {
    if (discount > 0) {
      setDiscount(0);
      setCouponError("Cart modified. Please click Apply to verify your coupon again.");
    }
  };

  const increaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    updateCartStorage(updatedCart);
    handleCartModification(); // ✅ Trigger reset
  };

  const decreaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    updateCartStorage(updatedCart);
    handleCartModification(); // ✅ Trigger reset
  };

  const removeItem = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    updateCartStorage(updatedCart);
    handleCartModification(); // ✅ Trigger reset
  };

  const availableItems = cart.filter(item => item.is_available !== false);
  const unavailableItemsCount = cart.length - availableItems.length;
  
  const subtotal = availableItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalTotal = subtotal - discount;

  const handleApplyCoupon = async () => {
    setCouponError("");
    
    // ✅ FIX 1: Prevent Guest Users from applying coupons
    if (!user) {
      setCouponError("Coupons are only available to logged-in users. Redirecting...");
      setTimeout(() => {
        router.push("/"); // Redirects to home so they can login
      }, 2000);
      return;
    }

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
          user_id: user.id, // ✅ FIX 2: Safely passing the user ID to check the usage limit
          items: availableItems.map((item) => ({ 
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        setCouponError("Server rejected the request. Check browser console.");
        return;
      }

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
    if (unavailableItemsCount > 0) {
        alert("Please remove unavailable items from your cart before proceeding.");
        return;
    }

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
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
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

        {unavailableItemsCount > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-bold">
                    You have {unavailableItemsCount} item(s) in your cart that cannot be delivered to your currently selected location. Please remove them to checkout.
                </p>
            </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center shadow-sm border border-dashed border-gray-200">
            <p className="text-gray-400 mb-6 font-medium italic">Your cart is currently empty.</p>
            <Link href="/" className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => {
                const totalWeight = calculateTotalWeight(item.quantity, item.unit);
                const isUnavailable = item.is_available === false; 

                return (
                  <div key={item.id} className={`bg-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-6 border transition-colors group relative overflow-hidden ${isUnavailable ? 'opacity-60 border-red-200 bg-red-50/30' : 'border-transparent hover:border-green-100'}`}>
                    
                    {item.unit && !isUnavailable && (
                        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1.5 z-10">
                            <Scale className="w-3 h-3 opacity-60" />
                            <span className="text-[11px] font-black uppercase tracking-wider">{totalWeight} Total</span>
                        </div>
                    )}

                    {isUnavailable && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1.5 z-10">
                            <span className="text-[10px] font-black uppercase tracking-wider">Out of Delivery Zone</span>
                        </div>
                    )}

                    <Link href={isUnavailable ? '#' : `/user/product/${item.slug}`} className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border p-2 flex-shrink-0 mt-4 sm:mt-0 cursor-pointer">
                      {item.image ? (
                        <img src={`http://localhost:8000${item.image}`} alt={item.name} className={`w-full h-full object-contain ${!isUnavailable && 'group-hover:scale-110 transition-transform'}`} />
                      ) : (
                        <div className="text-[10px] text-gray-300 font-bold uppercase">No Image</div>
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        {isUnavailable ? (
                           <h2 className="text-xl font-black text-slate-500 leading-tight pr-24 line-through">{item.name}</h2>
                        ) : (
                            <Link href={`/user/product/${item.slug}`} className="cursor-pointer group-hover:text-green-600 transition-colors">
                              <h2 className="text-xl font-black text-slate-800 leading-tight pr-24">{item.name}</h2>
                            </Link>
                        )}
                        <p className="text-gray-400 text-xs mt-1 font-bold tracking-wide">
                          ₹{item.price} {item.unit ? `per ${item.unit}` : 'per unit'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <div className={`flex items-center bg-gray-50 border rounded-lg overflow-hidden ${isUnavailable && 'opacity-50 pointer-events-none'}`}>
                          <button onClick={() => decreaseQuantity(item.id)} className="px-3 py-1 hover:bg-white font-black text-slate-600 transition-colors">-</button>
                          <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => increaseQuantity(item.id)} className="px-3 py-1 hover:bg-white font-black text-slate-600 transition-colors">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 text-[10px] font-black uppercase hover:text-red-700 transition-colors tracking-widest">
                          Remove Item
                        </button>
                      </div>
                    </div>

                    <div className={`text-xl font-black self-start sm:self-center mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto text-right ${isUnavailable ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm h-fit border sticky top-24">
              <h2 className="text-lg font-black mb-6 text-slate-800 uppercase tracking-widest">Summary</h2>
              
              <div className="mb-8">
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Promo Code" className="flex-1 border bg-gray-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 font-bold" disabled={unavailableItemsCount > 0} />
                  <button onClick={handleApplyCoupon} disabled={unavailableItemsCount > 0} className="bg-slate-800 text-white px-5 rounded-xl text-xs font-black hover:bg-black transition-colors uppercase disabled:opacity-50">Apply</button>
                </div>
                {couponError && <div className={`text-[10px] mt-2 font-black uppercase ${couponError.includes("modified") ? "text-yellow-600" : "text-red-500"}`}>{couponError}</div>}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 text-sm font-bold"><span>Subtotal</span><span className="text-slate-800">₹{subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600 text-sm font-black"><span>Discount</span><span>- ₹{discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-gray-500 text-sm font-bold"><span>Delivery</span><span className="text-green-600">Calculated at checkout</span></div>
              </div>

              <div className="border-t border-dashed pt-6 flex justify-between text-2xl font-black text-slate-900 mb-8">
                <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <button 
                onClick={proceedToCheckout} 
                disabled={unavailableItemsCount > 0 || availableItems.length === 0}
                className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 text-lg disabled:bg-gray-300 disabled:shadow-none disabled:active:scale-100"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}