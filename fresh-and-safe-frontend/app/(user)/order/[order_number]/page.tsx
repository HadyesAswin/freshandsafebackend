"use client";

import { useEffect, useState, use } from "react"; 
import Link from "next/link";
import { Scale } from "lucide-react"; // Optional: adds a nice little icon

// Helper to map database status to a progress bar step (0 to 3)
const getStepIndex = (status: string) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (["pending", "confirmed"].includes(s)) return 0;
  if (["preparing", "ready_for_pickup"].includes(s)) return 1;
  if (["out_for_delivery"].includes(s)) return 2;
  if (["delivered"].includes(s)) return 3;
  return -1; // -1 handles cancelled/unknown
};

// Helper for dynamic badge colors
const getBadgeStyle = (status: string) => {
  if (!status) return 'bg-gray-100 text-gray-700';
  const s = status.toLowerCase();
  if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
  if (s === 'confirmed') return 'bg-blue-100 text-blue-700';
  if (s === 'preparing') return 'bg-indigo-100 text-indigo-700';
  if (s === 'ready_for_pickup') return 'bg-orange-100 text-orange-700';
  if (s === 'out_for_delivery') return 'bg-purple-100 text-purple-700';
  if (s === 'delivered') return 'bg-green-100 text-green-700';
  if (s === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

// ✅ HELPER: Calculates total weight (e.g., 3 x 200g = 600g) for the customer
const calculateTotalWeight = (qty: number, unitStr: string | undefined) => {
  if (!unitStr) return "";
  const unit = unitStr.toLowerCase();
  const match = unit.match(/(\d+(\.\d+)?)/); 
  const unitValue = match ? parseFloat(match[0]) : 1;

  if (unit.includes("g") && !unit.includes("k")) {
    const totalG = qty * unitValue;
    return totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
  }
  if (unit.includes("kg")) {
    return `${(qty * unitValue).toFixed(1)}kg`;
  }
  if (unit.includes("pc") || unit.includes("piece")) {
    return `${qty * unitValue} Pieces`;
  }
  return `${qty * unitValue} ${unitStr}`;
};

export default function OrderDetailsPage({ params }: { params: Promise<{ order_number: string }> }) {
  // Next.js 15/16 fix: Unwrap the params promise
  const unwrappedParams = use(params);
  const orderNumber = unwrappedParams.order_number;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/orders/details/${orderNumber}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Order Details...</div>;
  
  if (!order || order.detail === "Order not found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 font-bold mb-4">Order Not Found</p>
        <Link href="/account" className="text-green-600 underline font-bold">Back to My Account</Link>
      </div>
    );
  }

  // Define our 4 core visual steps
  const trackingSteps = ['Order Placed', 'Preparing Food', 'Out for Delivery', 'Delivered'];
  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-6">
        
        <Link href="/account" className="text-sm font-bold text-gray-400 hover:text-green-600 mb-6 inline-block transition-colors">
          ← Back to My Orders
        </Link>

        {/* Order Header Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800">Order Details</h1>
            <p className="text-gray-400 font-medium mt-1">Placed on {order.date}</p>
          </div>
          <div className="bg-green-50 px-6 py-3 rounded-xl border border-green-100">
            <p className="text-[10px] text-green-600 uppercase font-black tracking-widest mb-1">Order Identifier</p>
            <p className="text-xl font-black text-green-700">{order.order_number}</p>
          </div>
        </div>

        {/* LIVE ORDER TRACKING PROGRESS BAR */}
        {order.status?.toLowerCase() !== 'cancelled' ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border mb-6 pb-14">
            <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-10 border-b pb-2">Live Tracking</h3>
            
            <div className="relative mx-auto h-16 mt-4" style={{ width: '85%' }}>
              {/* Background Grey Line */}
              <div className="absolute left-0 top-0 w-full h-1.5 bg-gray-100 rounded-full z-0"></div>
              
              {/* Active Green Line */}
              <div 
                className="absolute left-0 top-0 h-1.5 bg-green-500 rounded-full z-0 transition-all duration-1000 ease-out" 
                style={{ width: `${(Math.max(currentStep, 0) / (trackingSteps.length - 1)) * 100}%` }}
              ></div>
              
              {/* Step Circles & Text */}
              {trackingSteps.map((step, index) => {
                const isActive = index <= currentStep;
                return (
                  <div 
                    key={step} 
                    className="absolute top-0 flex flex-col items-center" 
                    style={{ 
                      left: `${(index / (trackingSteps.length - 1)) * 100}%`, 
                      transform: 'translate(-50%, -40%)' // Centers the circle perfectly on the line
                    }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-500 ${
                      isActive ? 'bg-green-600 border-white text-white shadow-md scale-110' : 'bg-white border-gray-200 text-gray-300'
                    }`}>
                      {isActive ? '✓' : index + 1}
                    </div>
                    <p className={`mt-3 text-[10px] md:text-xs font-black uppercase tracking-wider absolute top-10 w-24 md:w-32 text-center ${
                      isActive ? 'text-green-700' : 'text-gray-400'
                    }`}>
                      {step}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 p-8 rounded-2xl mb-6 text-center shadow-sm">
            <p className="text-red-600 font-black uppercase tracking-widest text-lg">Order Cancelled</p>
            <p className="text-red-500 text-sm font-medium mt-1">This order was cancelled and will not be delivered.</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Shipping Address Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border md:col-span-2">
            <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4 border-b pb-2">Shipping Information</h3>
            <p className="font-black text-gray-800 text-lg">{order.shipping_address.name}</p>
            <div className="mt-3 space-y-1 text-gray-600">
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p className="font-medium">{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zipcode}</p>
            </div>
            <p className="text-gray-800 font-bold mt-4 flex items-center gap-2">
                <span className="text-lg">📞</span> {order.shipping_address.phone}
            </p>
          </div>

          {/* Status & Payment Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Order Status</h3>
            <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${getBadgeStyle(order.status)}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
            <div className="mt-6 pt-6 border-t w-full">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Payment via</p>
                <p className="font-black text-gray-700 uppercase">{order.payment_method}</p>
            </div>
          </div>
        </div>

        {/* Items Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-10">
          <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Items Ordered</h3>
            <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border">
                {order.items.length} Products
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                <tr className="border-b text-[10px] text-gray-400 uppercase font-black tracking-widest bg-white">
                    <th className="p-6">Product Item</th>
                    <th className="p-6 text-center">Unit Price</th>
                    <th className="p-6 text-center">Quantity</th>
                    <th className="p-6 text-right">Line Total</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {order.items.map((item: any) => {
                  const totalWeightStr = calculateTotalWeight(item.quantity, item.unit);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 flex items-center gap-4">
                          <div className="w-16 h-16 bg-white border rounded-xl overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                          {item.image ? (
                              <img src={`http://localhost:8000${item.image}`} className="w-full h-full object-contain" alt={item.name} />
                          ) : (
                              <div className="text-[10px] text-gray-300">No Image</div>
                          )}
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="font-bold text-gray-800 leading-tight">{item.name}</span>
                            {/* ✅ Shows the customer exactly how much volume/weight they bought */}
                            {item.unit && (
                              <span className="text-[10px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded uppercase tracking-widest w-fit mt-1.5 flex items-center gap-1 border border-yellow-200">
                                <Scale className="w-3 h-3 opacity-60" /> {totalWeightStr} Total
                              </span>
                            )}
                          </div>
                      </td>
                      
                      {/* ✅ FIX: Now clearly forces the unit to display (e.g. ₹300.00 / 200g) */}
                      <td className="p-6 text-center text-gray-700 font-medium">
                          ₹{item.price.toFixed(2)}
                          <span className="text-xs text-gray-400 ml-1">/ {item.unit || 'unit'}</span>
                      </td>

                      <td className="p-6 text-center">
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg font-black text-sm border border-gray-200 shadow-inner">
                              {item.quantity}
                          </span>
                      </td>
                      <td className="p-6 text-right font-black text-gray-800">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
                </tbody>
            </table>
          </div>
          
          {/* Order Summary Footer */}
          <div className="bg-gray-50 p-8 flex flex-col items-end border-t">
            <div className="w-full max-w-xs space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-800">₹{order.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery Fee</span>
                <span className={`font-bold ${order.totals.delivery_fee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {order.totals.delivery_fee === 0 ? 'FREE' : `₹${order.totals.delivery_fee.toFixed(2)}`}
                </span>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between text-green-600 font-black">
                    <span>Coupon Discount</span>
                    <span>- ₹{order.totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-4 text-xl font-black text-gray-900 mt-4">
                <span>Total Amount</span>
                <span>₹{order.totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}