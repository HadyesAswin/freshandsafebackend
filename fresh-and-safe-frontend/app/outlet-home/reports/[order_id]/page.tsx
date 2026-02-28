"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Printer, 
  Loader2, 
  FileText, 
  MapPin, 
  CreditCard, 
  Package, 
  Image as ImageIcon 
} from "lucide-react";

export default function OrderDetails() {
  const { order_id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem("outlet_token");
      const res = await fetch(`http://localhost:8000/api/v1/outlet/orders/${order_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOrder(await res.json());
    };
    fetchDetails();
  }, [order_id]);

  // ✅ Helper for Status Badge Colors
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-200";
      case "preparing": return "bg-orange-50 text-orange-700 border-orange-200";
      case "out_for_delivery": return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading Order Summary...</p>
      </div>
    );
  }

  const currentStatus = order.order_status || order.status;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
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
              <span className={`px-2.5 py-0.5 text-[11px] rounded-full uppercase tracking-wider font-bold border ${getStatusStyle(currentStatus)}`}>
                {currentStatus || "Unknown"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
        >
          <Printer className="w-4 h-4 text-gray-500" />
          Print Invoice
        </button>
      </div>

      {/* Details Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Order Details Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-100 pb-3">
            <FileText className="w-4 h-4 text-red-500" />
            <h3>Order Details</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-medium text-gray-900">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Mode</span>
              <span className="font-medium text-gray-900 uppercase flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                {order.payment_method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Status</span>
              <span className="font-semibold text-gray-900 capitalize">{currentStatus}</span>
            </div>
          </div>
        </div>

        {/* Shipping Details Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-100 pb-3">
            <MapPin className="w-4 h-4 text-red-500" />
            <h3>Billing & Shipping</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer Name</span>
              <span className="font-medium text-gray-900">{order.delivery_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone Number</span>
              <span className="font-medium text-gray-900">{order.delivery_phone}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 whitespace-nowrap">Address</span>
              <span className="font-medium text-gray-900 text-right leading-relaxed">
                {order.delivery_address_line1},<br />
                {order.delivery_city}, {order.delivery_state} - {order.delivery_zipcode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-gray-900">Ordered Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Product</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Price</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Qty</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.order_items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900">{item.product?.name || "Product Name"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    ₹ {item.price_per_unit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹ {(item.price_per_unit * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Financial Summary */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
          <div className="w-full sm:w-72 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span> 
              <span className="font-medium text-gray-900">₹ {order.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Discount</span> 
              <span className="font-medium text-gray-900">- ₹ 0.00</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Charge</span> 
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 pt-3 mt-3 text-gray-900">
              <span>Payable Amount</span> 
              <span className="text-red-600">₹ {order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}