"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  MapPin, 
  Receipt, 
  CreditCard, 
  Package, 
  MessageSquare 
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-3">
        <Package className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium text-red-500">Order not found.</p>
      </div>
    );
  }

  // ✅ Reconcile status keys
  const currentStatus = order.order_status || order.status || "UNKNOWN";

  // Helper for dynamic badge colors
  const getBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-200";
      case "preparing": return "bg-orange-50 text-orange-700 border-orange-200";
      case "out_for_delivery": return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Order #{order.order_number}
            <span className={`px-2.5 py-0.5 text-[11px] rounded-full uppercase tracking-wider font-bold border ${getBadgeStyle(currentStatus)}`}>
              {currentStatus}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {order.created_at ? new Date(order.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer & Delivery Column */}
        <div className="space-y-6">
          
          {/* Customer Details Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-100 pb-3">
              <User className="w-4 h-4 text-red-500" />
              <h3>Customer Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{order.customer_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{order.customer_phone || "N/A"}</span>
              </div>
              {order.customer_email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4 text-red-500" />
              <h3>Delivery Address</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {order.delivery_address_line1}<br />
              {order.delivery_address_line2 ? `${order.delivery_address_line2}, ` : ""}
              {order.delivery_city}, {order.delivery_state} - {order.delivery_zipcode}
            </p>
          </div>

          {/* Customer Note Card (Conditional) */}
          {order.customer_note && (
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-yellow-800 font-semibold">
                <MessageSquare className="w-4 h-4 text-yellow-600" />
                <h3>Customer Note</h3>
              </div>
              <p className="text-sm text-yellow-800 italic leading-relaxed">
                "{order.customer_note}"
              </p>
            </div>
          )}
        </div>

        {/* Payment & Financial Column */}
        <div className="space-y-6">
          
          {/* Financial Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-100 pb-3">
              <Receipt className="w-4 h-4 text-red-500" />
              <h3>Financial Summary</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span> 
                  <span className="font-medium text-gray-900">₹{(order.subtotal || order.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span> 
                  <span className="font-medium text-red-600">-₹{(order.discount_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 mt-3 pt-3 text-gray-900">
                    <span>Total Amount</span> 
                    <span>₹{(order.total_amount || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-900 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  {order.payment_method || "Online"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Status</span>
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                  order.payment_status === 'paid' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {order.payment_status || "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-gray-900">Ordered Items</h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-bold text-gray-900 mb-1">{item.product?.name || "Unknown Product"}</p>
                <p className="text-sm font-medium text-gray-500">
                  ₹{item.price_per_unit.toFixed(2)} <span className="mx-1 text-gray-300">×</span> {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  ₹{(item.price_per_unit * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          {(!order.order_items || order.order_items.length === 0) && (
            <div className="p-8 text-center text-gray-500 text-sm font-medium">
              No items found in this order.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}