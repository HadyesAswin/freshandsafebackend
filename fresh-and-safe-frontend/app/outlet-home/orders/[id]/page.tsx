"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  MapPin, 
  Receipt, 
  Package, 
  MessageSquare,
  Scale,
  Scissors,
  CheckCircle2,
  CreditCard,
  PackageOpen,
  Calendar
} from "lucide-react";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ REFINED SMART PACKING LOGIC (Kept exactly the same)
  const getPackingInstruction = (quantity: number, unitStr: string) => {
    if (!unitStr) return { action: "PACK", total: `${quantity} Units`, math: "" };

    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/);
    const unitValue = match ? parseFloat(match[0]) : null;

    // 1. Grams logic (e.g., 3 x 200g = 600g)
    if (unit.includes("g") && !unit.includes("k")) {
      if (unitValue) {
        const totalWeight = quantity * unitValue;
        return { 
          action: "CUT / WEIGH", 
          total: totalWeight >= 1000 ? `${totalWeight / 1000}kg` : `${totalWeight}g`, 
          math: `${quantity} x ${unitStr}` 
        };
      }
    }

    // 2. Kilograms logic
    if (unit.includes("kg")) {
      const val = unitValue || 1;
      const totalKg = quantity * val;
      return { action: "CUT / WEIGH", total: `${totalKg}kg`, math: `${quantity} x ${unitStr}` };
    }

    // 3. Piece/Pcs logic
    if (unit.includes("pc") || unit.includes("piece") || unit.includes("nos")) {
      return { action: "PICK", total: `${quantity} Pieces`, math: "" };
    }

    return { action: "PACK", total: `${quantity} ${unitStr}`, math: "" };
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const token = localStorage.getItem("outlet_token");
      try {
        const res = await fetch(`http://localhost:8000/api/v1/outlet/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm text-gray-500 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-screen flex items-center justify-center font-bold text-red-500">
        Order not found
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0 pt-8 animate-in fade-in duration-500">
      
      {/* --- HEADER AREA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-red-600" />
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Placed: {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border
            ${order.order_status === 'pending' 
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
              : 'bg-green-50 text-green-700 border-green-200'}`}>
            {order.order_status || order.status}
          </span>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
            Back
          </button>
        </div>
      </div>

      {/* --- CUSTOMER & PAYMENT GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold border-b border-gray-100 pb-3">
            <User className="w-4 h-4 text-red-600" />
            <h3>Customer & Delivery</h3>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">{order.customer_name}</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">
              {order.delivery_address_line1}<br/>
              {order.delivery_city}, {order.delivery_state} - {order.delivery_zipcode}
            </p>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2 text-gray-800 font-semibold text-sm">
               <span>📞 {order.customer_phone}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold border-b border-gray-100 pb-3">
            <Receipt className="w-4 h-4 text-red-600" />
            <h3>Payment Summary</h3>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-sm text-gray-600">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">₹{order.subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-gray-600">
                <span className="font-medium">Delivery Fee</span>
                <span className="font-bold text-gray-900">₹{order.delivery_fee.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-gray-900 font-bold text-sm">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">₹{order.total_amount.toFixed(2)}</span>
             </div>
             <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded border border-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                   <CreditCard className="w-3.5 h-3.5" /> {order.payment_method}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider
                  ${order.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                   {order.payment_status}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* --- CUTTING NOTE --- */}
      {order.customer_note && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex gap-4">
          <MessageSquare className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-red-800 uppercase tracking-wider mb-1">Customer Note / Cutting Requirement</h4>
            <p className="text-red-700 text-sm font-medium leading-relaxed">
              "{order.customer_note}"
            </p>
          </div>
        </div>
      )}

      {/* --- 📦 THE PACKING LIST --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-red-600" /> Dispatch Instructions
          </h3>
          <span className="text-gray-500 text-xs font-medium">Ready for packing</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {order.order_items?.map((item: any) => {
            const instr = getPackingInstruction(item.quantity, item.product?.unit || "");
            
            return (
              <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between md:items-center hover:bg-gray-50/50 transition-colors gap-6">
                
                {/* Product Name & Unit Price */}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Product</p>
                  <p className="font-bold text-gray-900 text-lg mb-2">
                    {item.product?.name || "Product"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                      ₹{item.price_per_unit.toFixed(2)} / {item.product?.unit || 'unit'}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      Total: ₹{(item.price_per_unit * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* ✅ THE CLEAR ACTION BOX */}
                <div className="bg-yellow-50 border border-yellow-200 px-6 py-4 rounded-xl text-center min-w-[220px]">
                  <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                     {instr.action === 'CUT / WEIGH' ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />} 
                     {instr.action}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {instr.total}
                  </p>
                  {instr.math && (
                    <p className="mt-1.5 text-[11px] font-semibold text-yellow-700">
                      ({instr.math})
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-center justify-center pl-2">
                  <div className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-transparent hover:text-green-500 hover:border-green-500 cursor-pointer transition-all bg-white shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}