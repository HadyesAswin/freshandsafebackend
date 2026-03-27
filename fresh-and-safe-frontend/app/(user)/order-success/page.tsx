"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number") || "Pending...";

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);

  // ✅ NEW: Fetch the actual order details from your backend when the page loads!
  useEffect(() => {
    if (orderNumber && orderNumber !== "Pending...") {
      fetch(`http://localhost:8000/api/v1/orders/details/${orderNumber}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => setOrderDetails(data))
        .catch((err) => console.error("Error fetching order details:", err));
    }
  }, [orderNumber]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setIsGuest(false);
    }
  }, []);

  const handleDownloadSummary = () => {
    if (!orderDetails) return;

    const doc = new jsPDF();

    // 🔵 Header
    doc.setFillColor(0, 184, 217); // your brand color
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Fresh & Safe", 14, 18);

    doc.setFontSize(10);
    doc.text(`Order #${orderDetails.order_number}`, 140, 15);

    // Reset color
    doc.setTextColor(0, 0, 0);

    // 🧾 Order Info
    doc.setFontSize(11);
    doc.text(`Date: ${orderDetails.date}`, 14, 40);

    // 📦 Table
    const tableData = orderDetails.items.map((item: any) => [
      item.name,
      item.quantity,
      `Rs. ${item.price}`,
      `Rs. ${item.subtotal}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Item", "Qty", "Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 184, 217],
      },
    });

    // 📊 Totals
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.text(`Subtotal: Rs. ${orderDetails.totals.subtotal}`, 140, finalY);
    finalY += 6;
    doc.text(`Delivery: Rs. ${orderDetails.totals.delivery_fee}`, 140, finalY);
    finalY += 6;
    doc.text(`Discount: Rs. ${orderDetails.totals.discount}`, 140, finalY);
    finalY += 6;

    doc.setFontSize(13);
    doc.setTextColor(0, 184, 217);
    doc.text(`Total: Rs. ${orderDetails.totals.total}`, 140, finalY);

    // 📍 Address Box
    finalY += 15;

    doc.setDrawColor(200);
    doc.rect(14, finalY, 180, 25);

    doc.setFontSize(10);
    doc.setTextColor(0);

    doc.text("Delivery Address:", 16, finalY + 6);
    doc.text(orderDetails.shipping_address.name, 16, finalY + 12);
    doc.text(orderDetails.shipping_address.line1, 16, finalY + 18);
    doc.text(
      `${orderDetails.shipping_address.city} - ${orderDetails.shipping_address.zipcode}`,
      16,
      finalY + 24
    );

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Thank you for shopping with Fresh & Safe ❤️", 14, 285);

    doc.save(`order-${orderDetails.order_number}.pdf`);
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl max-w-md w-full text-center border border-slate-100">
      {/* Animated Checkmark Icon */}
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
        <svg
          className="w-10 h-10 text-emerald-500 animate-[bounce_1s_ease-in-out]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
        Payment Successful!
      </h1>
      <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
        Thank you for shopping with Fresh&Safe. Your order is being processed and will be on its way soon.
      </p>

      {/* Order Details Box */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
          Your Order Number
        </p>
        <p className="text-xl font-extrabold text-emerald-600 tracking-widest">
          {orderNumber}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/"
          className="block w-full py-4 bg-[#00b8d9] text-white font-bold text-sm rounded-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all"
        >
          Explore More Products
        </Link>
        
        {/* ✅ UPDATED: Disable button until data loads */}
        <button
          onClick={handleDownloadSummary}
          disabled={!orderDetails}
          className={`block w-full py-3.5 bg-white text-slate-600 font-bold text-sm rounded-2xl border-2 transition-all ${
            !orderDetails
              ? "border-slate-100 opacity-50 cursor-not-allowed"
              : "border-slate-200 hover:border-[#00b8d9] hover:text-[#00b8d9] active:scale-[0.98]"
          }`}
        >
          {!orderDetails ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF...
            </span>
          ) : (
            "Download Order Summary"
          )}
        </button>

        {!isGuest && (
          <Link
            href="/account"
            className="block w-full py-3.5 bg-white text-slate-600 font-bold text-sm rounded-2xl border-2 border-slate-200 hover:border-[#00b8d9] hover:text-[#00b8d9] active:scale-[0.98] transition-all"
          >
            View My Orders
          </Link>
        )}

        {isGuest && (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
            Please save your order number for reference
          </p>
        )}
      </div>

      <p className="text-[10px] text-emerald-500 mt-8 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
        🔒 100% Safe & Secure
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00b8d9]" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Loading your order...
            </span>
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}