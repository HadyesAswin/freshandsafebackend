"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, ShieldCheck, Package, Tag, Truck, CreditCard, AlertCircle } from "lucide-react";
interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string;
  slug?: string;
  is_available?: boolean;
}

interface DeliveryAddress {
  id?: number;
  name: string;
  type: string;
  text: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// Helper function to load Razorpay SDK script into the browser
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Helper to calculate total purchase size for the summary
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

export default function CheckoutPage() {
  const router = useRouter();

  // Core Data States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Data from Cart Page (via localStorage)
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [discount, setDiscount] = useState({ code: "", amount: 0 });

  // Outlet
  const [outletId, setOutletId] = useState<number>(2);

  // Order Note
  const [note, setNote] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ─── Load everything from localStorage (set by Cart page) ───
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedUser = localStorage.getItem("user");
    const storedAddress = localStorage.getItem("selected_delivery_address");
    const storedFee = localStorage.getItem("calculated_delivery_fee");
    const storedDiscount = localStorage.getItem("checkout_discount");
    const storedOutlet = localStorage.getItem("outlet_id") || localStorage.getItem("selectedOutlet");

    // Guard: No cart → redirect back
    if (!storedCart || JSON.parse(storedCart).length === 0) {
      router.push("/cart");
      return;
    }

    // Guard: No address selected → redirect back to cart
    if (!storedAddress) {
      router.push("/cart");
      return;
    }

    setCart(JSON.parse(storedCart));
    setDeliveryAddress(JSON.parse(storedAddress));

    if (storedFee !== null && storedFee !== "null") {
      setDeliveryFee(JSON.parse(storedFee));
    }

    if (storedDiscount) {
      setDiscount(JSON.parse(storedDiscount));
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedOutlet) {
      setOutletId(parseInt(storedOutlet, 10));
    }

    setLoading(false);
  }, [router]);

  // ─── Calculations ───
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalTotal = subtotal + (deliveryFee || 0) - discount.amount;

  // ─── Submit Order & Trigger Razorpay ───
  // ─── Submit Order & Trigger Razorpay ───
  const handleSubmitOrder = async () => {
    if (!deliveryAddress) {
      setError("No delivery address found. Please go back to cart.");
      return;
    }

    // ✅ REMOVED the "&& subtotal <= 500" check. Now it ALWAYS requires a calculated delivery fee.
    if (deliveryFee === null) {
      setError("Delivery fee was not calculated properly. Please go back to cart and re-select your address.");
      return;
    }

    // ✅ NEW: Final Stockout Guard
    const hasUnavailableItems = cart.some(item => item.is_available === false);
    if (hasUnavailableItems) {
      setError("Some items in your cart are now out of stock. Please return to the cart and remove them.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const resScript = await loadRazorpayScript();
    if (!resScript) {
      alert("Failed to load Razorpay SDK. Are you online?");
      setIsSubmitting(false);
      return;
    }

    const customerName = deliveryAddress.name || "Guest";
    const customerPhone = deliveryAddress.phone || "";
    const customerEmail = deliveryAddress.email || "";

    const orderPayload = {
      outlet_id: outletId,
      user_id: user ? user.id : null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      delivery_name: customerName,
      delivery_phone: customerPhone,
      delivery_address_line1: deliveryAddress.address_line1 || "",
      delivery_address_line2: deliveryAddress.address_line2 || "",
      delivery_city: deliveryAddress.city || "",
      delivery_state: deliveryAddress.state || "",
      delivery_zipcode: deliveryAddress.zipcode || "",
      delivery_latitude: deliveryAddress.latitude || null,
      delivery_longitude: deliveryAddress.longitude || null,
      delivery_fee: deliveryFee || 0,
      payment_method: "online",
      coupon_code: discount.amount > 0 ? discount.code : null,
      customer_note: note,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price,
      })),
    };

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Order creation failed");
      }

      const responseData = await res.json();

      const options = {
        key: responseData.razorpay_key,
        amount: finalTotal * 100,
        currency: "INR",
        name: "Fresh and Safe",
        description: `Order ${responseData.order_number}`,
        order_id: responseData.razorpay_order_id,

        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(
              "http://localhost:8000/api/v1/orders/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            if (verifyRes.ok) {
              // Clear checkout-related localStorage
              localStorage.removeItem("cart");
              localStorage.removeItem("checkout_discount");
              localStorage.removeItem("selected_delivery_address");
              localStorage.removeItem("calculated_delivery_fee");
              router.push(
                `/order-success?order_number=${responseData.order_number}`
              );
            } else {
              alert("Payment verification failed! Please contact support.");
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment.");
            setIsSubmitting(false);
          }
        },

        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#00b8d9",
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      // @ts-ignore
      const rzp1 = new window.Razorpay(options);

      rzp1.on("payment.failed", function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setIsSubmitting(false);
      });

      rzp1.open();
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00b8d9]" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Preparing Checkout...
          </span>
        </div>
      </div>
    );
  }

  // ─── Main Checkout UI ───
  return (
    <main className="min-h-screen bg-slate-50 pt-8 pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-6">

        {/* Page Title */}
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Checkout
        </h1>
        <p className="text-slate-500 font-medium mb-10">
          Review your order and complete payment
        </p>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Guest Login Prompt */}
        {!user && (
          <div className="bg-cyan-50 border border-cyan-100 text-cyan-800 p-4 rounded-2xl text-sm mb-8 flex items-center gap-3">
            <div className="bg-white p-2 rounded-full text-[#00b8d9]">
              <ShieldCheck size={18} />
            </div>
            <p>
              Checking out as a guest.{" "}
              <span
                className="font-extrabold cursor-pointer hover:text-[#00b8d9] transition-colors"
                onClick={() => router.push("/")}
              >
                Log in
              </span>{" "}
              for order tracking and faster checkout!
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ═══════════════════════════════════════
              LEFT COLUMN: Order Details
          ═══════════════════════════════════════ */}
          <div className="flex-1 space-y-6">
            {/* ── Delivery Address Card ── */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                    <MapPin size={16} />
                  </div>
                  <h3 className="font-extrabold text-slate-800">
                    Delivery Address
                  </h3>
                </div>
                <button
                  onClick={() => router.push("/cart")}
                  className="text-xs font-bold text-[#00b8d9] hover:text-[#009bb3] bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>

              {deliveryAddress && (
                <div className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900">
                          {deliveryAddress.name}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                          {deliveryAddress.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {deliveryAddress.address_line1}
                        {deliveryAddress.address_line2 &&
                          `, ${deliveryAddress.address_line2}`}
                      </p>
                      <p className="text-sm text-slate-600 font-medium">
                        {deliveryAddress.city}
                        {deliveryAddress.state &&
                          `, ${deliveryAddress.state}`}{" "}
                        - {deliveryAddress.zipcode}
                      </p>
                      {deliveryAddress.phone && (
                        <p className="text-xs text-slate-400 font-bold mt-2">
                          📞 {deliveryAddress.phone}
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* ── Order Items Card ── */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                  <Package size={16} />
                </div>
                <h3 className="font-extrabold text-slate-800">
                  Order Items{" "}
                  <span className="text-slate-400 font-medium text-sm ml-1">
                    ({cart.length})
                  </span>
                </h3>
              </div>

              <div className="divide-y divide-slate-50">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    {/* Product Image */}
                    <div className={`w-16 h-16 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 relative ${item.is_available === false ? 'grayscale opacity-50' : ''}`}>
                      {item.image ? (
                        <img src={`http://localhost:8000${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300 font-bold uppercase">No Img</div>
                      )}
                      {/* Small Overlay Badge */}
                      {item.is_available === false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="text-[7px] font-black text-white bg-rose-600 px-1 rounded-sm uppercase tracking-tighter">Stockout</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate ${item.is_available === false ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 font-medium">
                          Qty: {item.quantity}
                        </span>
                        {item.unit && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">
                            {calculateTotalWeight(item.quantity, item.unit)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          ₹{item.price.toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Order Note ── */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </div>
                <h3 className="font-extrabold text-slate-800">
                  Order Note{" "}
                  <span className="text-slate-400 font-normal text-sm">
                    (Optional)
                  </span>
                </h3>
              </div>
              <div className="px-6 py-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any special instructions for delivery? (e.g., Ring the bell twice, Leave at the door...)"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              RIGHT COLUMN: Payment Summary (Sticky)
          ═══════════════════════════════════════ */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-white rounded-3xl border border-slate-100 sticky top-28 overflow-hidden">
              {/* Payment Method Header */}
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                    <CreditCard size={16} />
                  </div>
                  <h3 className="font-extrabold text-slate-800">
                    Payment Method
                  </h3>
                </div>
                <div className="p-4 border-2 border-emerald-400 bg-emerald-50 rounded-2xl flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center shrink-0 bg-white">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 text-sm block">
                      Online Payment
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      UPI, Cards, Netbanking via Razorpay
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="px-6 py-5 space-y-3.5 text-sm font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Delivery Fee */}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck size={14} className="text-slate-400" />
                    Delivery
                  </span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-500">Free</span>
                  ) : deliveryFee === null ? (
                    <span className="font-bold text-slate-400 italic text-xs">
                      Not calculated
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800">
                      ₹{deliveryFee.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Discount */}
                {discount.amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <Tag size={14} />
                      Discount
                      <span className="text-[9px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {discount.code}
                      </span>
                    </span>
                    <span className="font-bold">
                      - ₹{discount.amount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="px-6 py-5 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-600 font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    ₹{finalTotal.toFixed(2)}
                  </span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || !deliveryAddress}
                  className={`w-full font-bold text-lg py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group ${
                    isSubmitting || !deliveryAddress
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-[#00b8d9] text-white hover:-translate-y-1 active:scale-[0.98]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ₹{finalTotal.toFixed(2)}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Payment Icons */}
              <div className="px-6 pb-6">
                <div className="flex justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                  <div className="h-7 w-11 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
                      className="h-full w-auto object-contain"
                      alt="UPI"
                    />
                  </div>
                  <div className="h-7 w-11 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                    <img
                      src="https://api.iconify.design/logos:visa.svg"
                      className="h-3 w-auto object-contain"
                      alt="Visa"
                    />
                  </div>
                  <div className="h-7 w-11 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                      className="h-4 w-auto object-contain"
                      alt="Mastercard"
                    />
                  </div>
                  <div className="h-7 w-11 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png"
                      className="h-3.5 w-auto object-contain"
                      alt="Rupay"
                    />
                  </div>
                </div>
                <p className="text-center text-[10px] text-emerald-500 mt-4 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  🔒 100% Safe & Secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}