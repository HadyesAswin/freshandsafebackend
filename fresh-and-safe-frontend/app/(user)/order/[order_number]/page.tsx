"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Scale, Loader2, MapPin, Package, Truck, ChevronLeft } from "lucide-react";

const getStepIndex = (status: string) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (["pending", "confirmed"].includes(s)) return 0;
  if (["preparing", "ready_for_pickup"].includes(s)) return 1;
  if (["out_for_delivery"].includes(s)) return 2;
  if (["delivered"].includes(s)) return 3;
  return -1;
};

const getBadgeStyle = (status: string) => {
  if (!status) return 'bg-slate-100 text-slate-600';
  const s = status.toLowerCase();
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-100';
  if (s === 'confirmed') return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
  if (s === 'preparing') return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
  if (s === 'ready_for_pickup') return 'bg-orange-50 text-orange-700 border border-orange-100';
  if (s === 'out_for_delivery') return 'bg-purple-50 text-purple-700 border border-purple-100';
  if (s === 'delivered') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (s === 'cancelled') return 'bg-rose-50 text-rose-700 border border-rose-100';
  return 'bg-slate-100 text-slate-600';
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
  if (unit.includes("pc") || unit.includes("piece")) return `${qty * unitValue} Pieces`;
  return `${qty * unitValue} ${unitStr}`;
};

export default function OrderDetailsPage({ params }: { params: Promise<{ order_number: string }> }) {
  const unwrappedParams = use(params);
  const orderNumber = unwrappedParams.order_number;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/orders/details/${orderNumber}`)
      .then(res => res.json())
      .then(data => { setOrder(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#00b8d9]" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Order...</span>
        </div>
      </div>
    );
  }

  if (!order || order.detail === "Order not found") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 border border-rose-100">
          <Package className="w-8 h-8 text-rose-300" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Order Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 font-medium">We couldn't find this order.</p>
        <Link href="/account" className="text-[#00b8d9] font-bold text-sm">← Back to My Orders</Link>
      </div>
    );
  }

  const trackingSteps = ['Order Placed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <Link href="/account" className="text-slate-900 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <span className="font-semibold text-sm">Order Details</span>
        <div className="w-10"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-8">

        {/* Desktop Back */}
        <Link href="/account" className="hidden md:inline-flex text-sm font-bold text-slate-400 hover:text-[#00b8d9] mb-6 items-center gap-1.5 transition-colors">
          <ChevronLeft size={16} strokeWidth={3} /> Back to My Orders
        </Link>

        {/* Order Header */}
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-slate-100 mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Order Details</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Placed on {order.date}</p>
          </div>
          <div className="bg-cyan-50 px-4 md:px-6 py-2.5 md:py-3 rounded-xl border border-cyan-100">
            <p className="text-[9px] text-[#00b8d9] uppercase font-bold tracking-widest mb-0.5">Order Number</p>
            <p className="text-base md:text-lg font-extrabold text-slate-900">{order.order_number}</p>
          </div>
        </div>

        {/* Tracking Progress */}
        {order.status?.toLowerCase() !== 'cancelled' ? (
          <div className="bg-white p-5 md:p-8 rounded-2xl border border-slate-100 mb-4 md:mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 md:mb-10">Live Tracking</h3>

            <div className="relative mx-auto h-16 mt-4" style={{ width: '85%' }}>
              <div className="absolute left-0 top-0 w-full h-1 bg-slate-100 rounded-full z-0"></div>
              <div
                className="absolute left-0 top-0 h-1 bg-[#00b8d9] rounded-full z-0 transition-all duration-1000 ease-out"
                style={{ width: `${(Math.max(currentStep, 0) / (trackingSteps.length - 1)) * 100}%` }}
              ></div>

              {trackingSteps.map((step, index) => {
                const isActive = index <= currentStep;
                return (
                  <div key={step} className="absolute top-0 flex flex-col items-center" style={{ left: `${(index / (trackingSteps.length - 1)) * 100}%`, transform: 'translate(-50%, -40%)' }}>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm border-4 transition-all duration-500 ${
                      isActive ? 'bg-[#00b8d9] border-white text-white' : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {isActive ? '✓' : index + 1}
                    </div>
                    <p className={`mt-3 text-[8px] md:text-[10px] font-bold uppercase tracking-wider absolute top-8 md:top-10 w-16 md:w-28 text-center ${
                      isActive ? 'text-[#00b8d9]' : 'text-slate-400'
                    }`}>
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-100 p-6 md:p-8 rounded-2xl mb-4 md:mb-6 text-center">
            <p className="text-rose-600 font-extrabold uppercase tracking-widest text-sm">Order Cancelled</p>
            <p className="text-rose-500 text-xs font-medium mt-1">This order was cancelled and will not be delivered.</p>
          </div>
        )}

        {/* Address & Status */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                <MapPin size={13} />
              </div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Address</h3>
            </div>
            <p className="font-bold text-slate-900 text-sm md:text-base">{order.shipping_address.name}</p>
            <div className="mt-2 space-y-0.5 text-slate-600 text-xs md:text-sm font-medium">
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zipcode}</p>
            </div>
            {order.shipping_address.phone && (
              <p className="text-[10px] text-slate-400 font-bold mt-3">📞 {order.shipping_address.phone}</p>
            )}
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status</h3>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getBadgeStyle(order.status)}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
            <div className="mt-5 pt-5 border-t border-slate-100 w-full">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Payment</p>
              <p className="font-bold text-slate-700 text-xs uppercase">{order.payment_method}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6 md:mb-10">
          <div className="px-5 md:px-6 py-4 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-[#00b8d9]">
                <Package size={13} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Items Ordered</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              {order.items.length} Products
            </span>
          </div>

          {/* Mobile: Card Layout */}
          <div className="md:hidden divide-y divide-slate-50">
            {order.items.map((item: any) => {
              const totalWeightStr = calculateTotalWeight(item.quantity, item.unit);
              return (
                <div key={item.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                    {item.image ? (
                      <img src={`http://localhost:8000${item.image}`} className="w-full h-full object-cover" alt={item.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[7px] text-gray-300 font-bold">No Img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-medium">Qty: {item.quantity}</span>
                      {totalWeightStr && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-wider">
                          {totalWeightStr}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs">₹{item.subtotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Unit Price</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item: any) => {
                  const totalWeightStr = calculateTotalWeight(item.quantity, item.unit);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={`http://localhost:8000${item.image}`} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300 font-bold">No Img</div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                          {totalWeightStr && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider w-fit mt-1.5">
                              <Scale className="w-3 h-3 opacity-60" /> {totalWeightStr}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 text-sm font-medium">
                        ₹{item.price.toFixed(2)}
                        <span className="text-[10px] text-slate-400 ml-1">/ {item.unit || 'unit'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-50 text-slate-800 px-3 py-1 rounded-lg font-bold text-sm border border-slate-100">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-sm">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 px-5 md:px-8 py-5 md:py-6 flex flex-col items-end border-t border-slate-100">
            <div className="w-full md:max-w-xs space-y-2.5 text-sm font-medium text-slate-500">
              <div className="flex justify-between">
                <span className="text-xs">Subtotal</span>
                <span className="font-bold text-slate-800 text-xs">₹{order.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-xs">
                  <Truck size={12} className="text-slate-400" /> Delivery
                </span>
                {order.totals.delivery_fee === 0 ? (
                  <span className="font-bold text-emerald-500 text-xs">Free</span>
                ) : (
                  <span className="font-bold text-slate-800 text-xs">₹{order.totals.delivery_fee.toFixed(2)}</span>
                )}
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="text-xs">Discount</span>
                  <span className="font-bold text-xs">- ₹{order.totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 mt-2">
                <span className="font-bold text-slate-600 text-sm">Total</span>
                <span className="text-lg font-extrabold text-slate-900">₹{order.totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}