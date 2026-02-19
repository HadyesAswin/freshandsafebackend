"use client";

import { useEffect, useState, use } from "react"; // ✅ Added 'use'
import Link from "next/link";

export default function OrderDetailsPage({ params }: { params: Promise<{ order_number: string }> }) {
  // ✅ Next.js 15/16 fix: Unwrap the params promise
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
        <Link href="/user/account" className="text-green-600 underline font-bold">Back to My Account</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-6">
        
        <Link href="/user/account" className="text-sm font-bold text-gray-400 hover:text-green-600 mb-6 inline-block transition-colors">
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
            <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {order.status}
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
                {order.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 flex items-center gap-5">
                        <div className="w-16 h-16 bg-white border rounded-xl overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                        {item.image ? (
                            <img src={`http://localhost:8000${item.image}`} className="w-full h-full object-contain" alt={item.name} />
                        ) : (
                            <div className="text-[10px] text-gray-300">No Image</div>
                        )}
                        </div>
                        <span className="font-bold text-gray-800 leading-tight">{item.name}</span>
                    </td>
                    <td className="p-6 text-center text-gray-500 font-medium">₹{item.price.toFixed(2)}</td>
                    <td className="p-6 text-center">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg font-black text-sm">
                            {item.quantity}
                        </span>
                    </td>
                    <td className="p-6 text-right font-black text-gray-800">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                ))}
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