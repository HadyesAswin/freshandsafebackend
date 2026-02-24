"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const token = localStorage.getItem("outlet_token");
      try {
        const res = await fetch(`http://localhost:8000/api/v1/outlet/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("📦 Order Detail Data:", data); // Check console to see the keys
          setOrder(data);
        } else {
          console.error("Failed to fetch order details");
        }
      } catch (err) {
        console.error("Error connection to API:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetails();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading details...</div>;
  if (!order) return <div className="p-10 text-center text-red-500">Order not found.</div>;

  // ✅ Reconcile status keys (same logic as ShopHomePage)
  const currentStatus = order.order_status || order.status || "UNKNOWN";

  // Helper for dynamic badge colors
  const getBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return "bg-red-100 text-red-700";
    if (s === "delivered") return "bg-green-100 text-green-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <button 
        onClick={() => router.back()} 
        className="text-green-700 font-medium hover:underline flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <div className="flex justify-between border-b pb-4 mb-6 items-center">
          <div>
            <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
            <p className="text-sm text-gray-500">
              Placed on: {order.created_at ? new Date(order.created_at).toLocaleString() : "N/A"}
            </p>
          </div>
          {/* ✅ FIXED: Dynamic Badge */}
          <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase ${getBadgeStyle(currentStatus)}`}>
            {currentStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer & Delivery */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Customer Details</h2>
            <div className="text-gray-800 space-y-1">
              <p><strong>Name:</strong> {order.customer_name || "N/A"}</p>
              <p><strong>Phone:</strong> {order.customer_phone || "N/A"}</p>
              {order.customer_email && <p><strong>Email:</strong> {order.customer_email}</p>}
            </div>
            
            <h2 className="font-bold text-gray-400 uppercase text-xs tracking-widest pt-4">Delivery Address</h2>
            <p className="text-gray-700 leading-relaxed">
              {order.delivery_address_line1}<br />
              {order.delivery_address_line2 ? `${order.delivery_address_line2}, ` : ""}
              {order.delivery_city}, {order.delivery_state} - {order.delivery_zipcode}
            </p>
          </div>

          {/* Payment & Financial Summary */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Financial Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-100">
                <p className="flex justify-between text-gray-600">
                  <span>Subtotal:</span> 
                  <span>₹{(order.subtotal || order.total_amount || 0).toFixed(2)}</span>
                </p>
                <p className="flex justify-between text-red-500">
                  <span>Discount:</span> 
                  <span>-₹{(order.discount_amount || 0).toFixed(2)}</span>
                </p>
                <p className="flex justify-between font-bold text-lg border-t mt-2 pt-2 text-gray-900">
                    <span>Total Amount:</span> 
                    <span>₹{(order.total_amount || 0).toFixed(2)}</span>
                </p>
            </div>
            <div className="pt-2 text-sm space-y-1">
              <p>
                <strong>Payment Method:</strong> <span className="uppercase text-gray-600">{order.payment_method || "Online"}</span>
              </p>
              <p>
                <strong>Payment Status:</strong> 
                <span className={`ml-2 font-bold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                  {(order.payment_status || "pending").toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="mt-8">
          <h2 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Ordered Items</h2>
          <div className="border rounded-lg overflow-hidden divide-y">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                  <p className="font-medium text-gray-900">{item.product?.name || "Unknown Product"}</p>
                  <p className="text-sm text-gray-500">₹{item.price_per_unit} x {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-800">
                  ₹{(item.price_per_unit * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {order.customer_note && (
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h3 className="text-xs font-bold uppercase text-yellow-700 mb-1">Customer Note</h3>
            <p className="text-gray-700 italic text-sm">"{order.customer_note}"</p>
          </div>
        )}
      </div>
    </div>
  );
}