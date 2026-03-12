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
  CreditCard
} from "lucide-react";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ REFINED SMART PACKING LOGIC
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

    // 3. Piece/Pcs logic - Removed the redundant "Size" for simple pieces
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;
  if (!order) return <div className="h-screen flex items-center justify-center font-bold text-red-500">Order not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0 pt-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6 border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order #{order.order_number}</h1>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
              Placed: {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full border-2 font-black text-xs uppercase tracking-widest bg-white shadow-sm
          ${order.order_status === 'pending' ? 'border-yellow-400 text-yellow-600' : 'border-green-500 text-green-600'}`}>
          {order.order_status || order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold border-b pb-3">
            <User className="w-4 h-4 text-red-500" />
            <h3>Customer & Delivery</h3>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-black text-slate-800">{order.customer_name}</p>
            <p className="text-gray-500 font-medium leading-relaxed">
              {order.delivery_address_line1}<br/>
              {order.delivery_city}, {order.delivery_state} - {order.delivery_zipcode}
            </p>
            <div className="mt-4 flex items-center gap-2 text-red-600 font-black text-sm">
               <span>📞 {order.customer_phone}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold border-b pb-3">
            <Receipt className="w-4 h-4 text-red-500" />
            <h3>Payment Summary</h3>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Subtotal</span>
                <span className="font-black text-slate-700">₹{order.subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Delivery Fee</span>
                <span className="font-black text-slate-700">₹{order.delivery_fee.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-900 font-black uppercase text-xs">Total Amount</span>
                <span className="text-3xl font-black text-green-600">₹{order.total_amount.toFixed(2)}</span>
             </div>
             <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded border uppercase tracking-widest flex items-center gap-1">
                   <CreditCard className="w-3 h-3" /> {order.payment_method}
                </span>
                <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest
                  ${order.payment_status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                   {order.payment_status}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* 📦 THE PACKING LIST */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-yellow-400" /> Dispatch Instructions
          </h3>
          <span className="text-white/50 text-[10px] font-bold uppercase">Ready for packing</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {order.order_items?.map((item: any) => {
            const instr = getPackingInstruction(item.quantity, item.product?.unit || "");
            
            return (
              <div key={item.id} className="p-8 flex flex-col lg:flex-row justify-between lg:items-center hover:bg-gray-50/50 transition-all gap-8">
                
                {/* Product Name & Unit Price */}
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Product</p>
                  <p className="font-black text-gray-900 text-3xl tracking-tighter uppercase leading-none mb-3">
                    {item.product?.name || "Product"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      ₹{item.price_per_unit.toFixed(2)} / {item.product?.unit || 'unit'}
                    </span>
                    <span className="text-xs font-black text-gray-300 uppercase tracking-wide">
                      Total: ₹{(item.price_per_unit * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* ✅ THE CLEAR ACTION BOX */}
                <div className="bg-yellow-400 border-b-4 border-yellow-600 px-8 py-5 rounded-2xl text-center min-w-[280px] shadow-sm">
                  <p className="text-[10px] font-black text-yellow-900 uppercase tracking-[0.2em] mb-1 flex items-center justify-center gap-2">
                     {instr.action === 'CUT / WEIGH' ? <Scissors className="w-3 h-3" /> : <Package className="w-3 h-3" />} 
                     {instr.action}
                  </p>
                  <p className="text-5xl font-black text-gray-900 leading-none">
                    {instr.total}
                  </p>
                  {instr.math && (
                    <p className="mt-2 text-xs font-black text-yellow-800 bg-white/30 rounded py-0.5 px-2 inline-block">
                      {instr.math}
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl border-4 border-gray-100 flex items-center justify-center text-transparent hover:text-green-500 hover:border-green-500 cursor-pointer transition-all bg-white">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Special Cutting Note */}
      {order.customer_note && (
        <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 flex gap-4">
          <MessageSquare className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1 underline">Cutting Requirement:</h4>
            <p className="text-red-700 italic text-xl font-black leading-tight">
              "{order.customer_note}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}