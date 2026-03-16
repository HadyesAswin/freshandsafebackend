"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  MapPin,
  ChevronLeft,
  ShieldCheck,
  Package,
  Tag,
  Truck,
  CreditCard,
  AlertCircle,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string;
  slug?: string;
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

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  if (unit.includes("pc") || unit.includes("piece"))
    return `${qty * unitValue} Pcs`;
  return `${qty * unitValue} ${unitStr}`;
};

export default function CheckoutMobile() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [discount, setDiscount] = useState({ code: "", amount: 0 });

  const [outletId, setOutletId] = useState<number>(2);
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedUser = localStorage.getItem("user");
    const storedAddress = localStorage.getItem("selected_delivery_address");
    const storedFee = localStorage.getItem("calculated_delivery_fee");
    const storedDiscount = localStorage.getItem("checkout_discount");
    const storedOutlet =
      localStorage.getItem("outlet_id") ||
      localStorage.getItem("selectedOutlet");

    if (!storedCart || JSON.parse(storedCart).length === 0) {
      router.push("/cart");
      return;
    }
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

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const finalTotal = subtotal + (deliveryFee || 0) - discount.amount;

  const handleSubmitOrder = async () => {
    if (!deliveryAddress) {
      setError("No delivery address found. Please go back to cart.");
      return;
    }
    if (deliveryFee === null && subtotal <= 500) {
      setError(
        "Delivery fee was not calculated. Please go back to cart and re-select your address."
      );
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
        theme: { color: "#00b8d9" },
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#00b8d9]" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Preparing Checkout...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-44 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => router.push("/cart")}
          className="text-slate-900 p-2 -ml-2"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-sm">Checkout</span>
        <div className="w-10"></div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold leading-relaxed">{error}</p>
        </div>
      )}

      {/* Guest Prompt */}
      {!user && (
        <div className="mx-4 mt-3 bg-cyan-50 border border-cyan-100 text-cyan-800 p-3 rounded-xl flex items-center gap-2.5">
          <div className="bg-white p-1.5 rounded-full text-[#00b8d9] flex-shrink-0">
            <ShieldCheck size={14} />
          </div>
          <p className="text-[11px] font-medium leading-relaxed">
            Guest checkout.{" "}
            <span
              className="font-extrabold cursor-pointer text-[#00b8d9]"
              onClick={() => router.push("/")}
            >
              Log in
            </span>{" "}
            for order tracking!
          </p>
        </div>
      )}

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* ── Delivery Address ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                <MapPin size={13} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Delivery Address
              </h3>
            </div>
            <button
              onClick={() => router.push("/cart")}
              className="text-[10px] font-bold text-[#00b8d9] bg-cyan-50 px-2.5 py-1 rounded-lg"
            >
              Change
            </button>
          </div>

          {deliveryAddress && (
            <div className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {deliveryAddress.name}
                    </h4>
                    <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                      {deliveryAddress.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {deliveryAddress.address_line1}
                    {deliveryAddress.address_line2 &&
                      `, ${deliveryAddress.address_line2}`}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {deliveryAddress.city}
                    {deliveryAddress.state && `, ${deliveryAddress.state}`} -{" "}
                    {deliveryAddress.zipcode}
                  </p>
                  {deliveryAddress.phone && (
                    <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                      📞 {deliveryAddress.phone}
                    </p>
                  )}
                </div>
                {deliveryAddress.latitude && deliveryAddress.longitude && (
                  <div className="flex-shrink-0 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[8px] font-bold uppercase tracking-wider">
                      GPS
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Order Items ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
              <Package size={13} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              Items{" "}
              <span className="text-slate-400 font-medium">
                ({cart.length})
              </span>
            </h3>
          </div>

          <div className="divide-y divide-slate-50">
            {cart.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                  {item.image ? (
                    <img
                      src={`http://localhost:8000${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[7px] text-gray-300 font-bold uppercase">
                      No Img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-xs truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Qty: {item.quantity}
                    </span>
                    {item.unit && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-wider">
                        {calculateTotalWeight(item.quantity, item.unit)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-extrabold text-slate-900 text-xs">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  {item.quantity > 1 && (
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      ₹{item.price.toFixed(2)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Note ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              Note{" "}
              <span className="text-slate-400 font-normal text-xs">
                (Optional)
              </span>
            </h3>
          </div>
          <div className="px-4 py-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Special delivery instructions..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-sm font-medium outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
              <CreditCard size={13} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">Payment</h3>
          </div>
          <div className="px-4 py-3">
            <div className="p-3.5 border-2 border-emerald-400 bg-emerald-50 rounded-xl flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center shrink-0 bg-white">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <div>
                <span className="font-bold text-emerald-900 text-xs block">
                  Online Payment
                </span>
                <span className="text-[9px] text-emerald-700 font-medium">
                  UPI, Cards, Netbanking via Razorpay
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bill Summary ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Bill Summary
            </h3>
          </div>
          <div className="px-4 py-3.5 space-y-2.5 text-sm font-medium text-slate-500">
            <div className="flex justify-between">
              <span className="text-xs">Subtotal</span>
              <span className="font-bold text-slate-800 text-xs">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-xs">
                <Truck size={12} className="text-slate-400" />
                Delivery
              </span>
              {deliveryFee === 0 ? (
                <span className="font-bold text-emerald-500 text-xs">Free</span>
              ) : deliveryFee === null ? (
                <span className="font-bold text-slate-400 italic text-[10px]">
                  Not calculated
                </span>
              ) : (
                <span className="font-bold text-slate-800 text-xs">
                  ₹{deliveryFee.toFixed(2)}
                </span>
              )}
            </div>

            {deliveryFee === 0 && subtotal > 500 && (
              <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center border border-emerald-100">
                🎉 Free delivery on orders above ₹500
              </div>
            )}

            {discount.amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="flex items-center gap-1.5 text-xs">
                  <Tag size={12} />
                  Discount
                  <span className="text-[8px] font-bold bg-emerald-100 px-1 py-0.5 rounded uppercase tracking-wider">
                    {discount.code}
                  </span>
                </span>
                <span className="font-bold text-xs">
                  - ₹{discount.amount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-xs">Taxes</span>
              <span className="font-bold text-slate-800 text-xs">₹0.00</span>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-50">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-bold text-sm">Total</span>
              <span className="text-xl font-extrabold text-slate-900">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Icons */}
        <div className="flex justify-center gap-2.5 pt-2 pb-4">
          <div className="h-6 w-10 flex items-center justify-center bg-white rounded border border-slate-100 p-1">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
              className="h-full w-auto object-contain"
              alt="UPI"
            />
          </div>
          <div className="h-6 w-10 flex items-center justify-center bg-white rounded border border-slate-100 p-1">
            <img
              src="https://api.iconify.design/logos:visa.svg"
              className="h-2.5 w-auto object-contain"
              alt="Visa"
            />
          </div>
          <div className="h-6 w-10 flex items-center justify-center bg-white rounded border border-slate-100 p-1">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
              className="h-3.5 w-auto object-contain"
              alt="Mastercard"
            />
          </div>
          <div className="h-6 w-10 flex items-center justify-center bg-white rounded border border-slate-100 p-1">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png"
              className="h-3 w-auto object-contain"
              alt="Rupay"
            />
          </div>
        </div>

        <p className="text-center text-[9px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1 pb-2">
          🔒 100% Safe & Secure
        </p>
      </div>

      {/* ✅ Sticky Pay Button — sits ABOVE MobileNavbar */}
      <div className="fixed bottom-16 left-0 right-0 z-[45] p-3">
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || !deliveryAddress}
          className={`w-full p-3.5 rounded-xl flex items-center justify-between active:scale-[0.98] transition-all ${
            isSubmitting || !deliveryAddress
              ? "bg-slate-300 text-white/80"
              : "bg-[#00b8d9] text-white"
          }`}
        >
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
              {cart.length} Items
            </span>
            <span className="text-lg font-extrabold leading-none">
              ₹{finalTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 font-bold text-sm bg-black/10 px-4 py-1.5 rounded-lg">
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                Pay Now
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}