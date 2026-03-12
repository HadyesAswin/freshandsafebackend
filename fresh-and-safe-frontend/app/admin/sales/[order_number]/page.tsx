"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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

// ✅ Helper for Status Badge Colors & Text
const getStatusBadgeInfo = (status: string) => {
  const s = status?.toLowerCase() || "";
  switch (s) {
    case "pending": return { text: "Pending", style: "bg-gray-100 text-gray-700 border-gray-200" };
    case "confirmed": return { text: "Confirmed", style: "bg-blue-50 text-blue-700 border-blue-200" };
    case "preparing": return { text: "Preparing", style: "bg-orange-50 text-orange-700 border-orange-200" };
    case "ready_for_pickup": return { text: "Waiting for Rider", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "out_for_delivery": return { text: "Out for Delivery", style: "bg-purple-50 text-purple-700 border-purple-200" };
    case "delivered": return { text: "Delivered", style: "bg-green-50 text-green-700 border-green-200" };
    case "cancelled": return { text: "Cancelled", style: "bg-red-50 text-red-700 border-red-200" };
    default: return { text: status.replace(/_/g, ' ').toUpperCase(), style: "bg-gray-50 text-gray-700 border-gray-200" };
  }
};

// ✅ ADDED: Helper to calculate total purchase size for Admin Review
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

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ order_number: string }> }) {
  // Next.js 15+ Params unwrap
  const unwrappedParams = use(params);
  const orderNumber = unwrappedParams.order_number;
  
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetching from the standard details endpoint
        const res = await fetch(`http://localhost:8000/api/v1/orders/details/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading Order Summary...</p>
      </div>
    );
  }

  if (!order || order.detail === "Order not found") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-3">
        <p className="text-xl font-bold text-gray-800">Order Not Found</p>
        <button onClick={() => router.back()} className="text-sm text-red-600 font-medium hover:underline">
          Go back to Sales
        </button>
      </div>
    );
  }

  const badgeInfo = getStatusBadgeInfo(order.status);

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
              <span className={`px-2.5 py-0.5 text-[11px] rounded-full uppercase tracking-wider font-bold border ${badgeInfo.style}`}>
                {badgeInfo.text}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {order.date}
            </p>
          </div>
        </div>
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
              <span className="text-gray-500">Live Status</span>
              <span className="font-semibold text-gray-900 capitalize">{badgeInfo.text}</span>
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
              <span className="font-medium text-gray-900">{order.shipping_address?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone Number</span>
              <span className="font-medium text-gray-900">{order.shipping_address?.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 whitespace-nowrap">Address</span>
              <span className="font-medium text-gray-900 text-right leading-relaxed">
                {order.shipping_address?.line1},<br />
                {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.zipcode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-gray-900">Ordered Items ({order.items?.length || 0})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Product</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Unit Price</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Qty</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
                        {item.image ? (
                           <img src={`http://localhost:8000${item.image}`} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                           <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {/* ✅ ADded dynamic Total Weight for Admin insight */}
                        {item.unit && (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            Total: {calculateTotalWeight(item.quantity, item.unit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {/* ✅ Corrected Unit Price display */}
                    ₹ {item.price?.toFixed(2)} 
                    <span className="text-xs text-gray-400 ml-1">/ {item.unit || 'unit'}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">
                    <span className="bg-gray-100 px-3 py-1 rounded-md border">
                        {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹ {item.subtotal?.toFixed(2)}
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
              <span className="font-medium text-gray-900">₹ {order.totals?.subtotal?.toFixed(2) || "0.00"}</span>
            </div>
            {order.totals?.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount</span> 
                <span>- ₹ {order.totals?.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Charge</span> 
              <span className={`font-medium ${order.totals?.delivery_fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {order.totals?.delivery_fee === 0 ? 'Free' : `₹ ${order.totals?.delivery_fee?.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 pt-3 mt-3 text-gray-900">
              <span>Payable Amount</span> 
              <span className="text-red-600">₹ {order.totals?.total?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}