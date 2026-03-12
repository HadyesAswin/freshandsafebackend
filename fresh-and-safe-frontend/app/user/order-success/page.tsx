"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number") || "Pending...";

  // ✅ State to track if user is a guest or logged in
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setIsGuest(false);
    }
  }, []);

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-green-500 animate-fadeIn">
      
      {/* Animated Checkmark Icon */}
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg 
          className="w-12 h-12 text-green-600 animate-[bounce_1s_ease-in-out]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h1 className="text-3xl font-black text-gray-800 mb-2">Payment Successful!</h1>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Thank you for shopping with Fresh&Safe. Your order is being processed and will be on its way soon.
      </p>
      
      {/* Order Details Box */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-inner">
        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">
          Your Order Number
        </p>
        <p className="text-xl font-black text-green-700 tracking-widest">
          {orderNumber}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Link 
          href="/" 
          className="block w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          Explore More Products
        </Link>
        
        {/* ✅ DYNAMIC LOGIC: Only show "View My Orders" if NOT a guest */}
        {!isGuest && (
          <Link 
            href="/user/account" 
            className="block w-full py-3 bg-white text-gray-600 font-bold rounded-xl border-2 border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
          >
            View My Orders
          </Link>
        )}

        {/* ✅ Helpful note for guests */}
        {isGuest && (
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight pt-2">
            Please save your order number for reference
          </p>
        )}
      </div>
      
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Suspense is required by Next.js when using useSearchParams() */}
      <Suspense fallback={
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold">Loading your order...</p>
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}