"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingBag, 
  RefreshCw, 
  Loader2, 
  PackageOpen, 
  ChevronRight,
  CheckCircle2
} from "lucide-react";

export default function ShopHomePage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const token = localStorage.getItem("outlet_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/outlet/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        console.log("📦 RAW DATA FROM BACKEND:", data);

        // ✅ Check both keys just in case
        const activeOrders = data
          .filter(
            (o: any) => !["delivered", "out_for_delivery"].includes((o.order_status || o.status)?.toLowerCase())
          )
          .sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
        setOrders(activeOrders);
      } else {
        console.error("❌ API Error:", res.status);
      }
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: number, currentStatus: string) => {
    const token = localStorage.getItem("outlet_token");
    const status = currentStatus?.toLowerCase();

    // =================================================================
    // 🚚 THE QWQER DISPATCH STEP 
    // =================================================================
    if (status === "preparing") {
      if (!window.confirm("Are you sure the order is packed and ready for the QWQER rider?")) return;

      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/dispatch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        });

        const data = await res.json();

        if (res.ok) {
          alert(`Success! QWQER driver assigned.\nTracking Key: ${data.qwqer_details.order_key}`);
          fetchOrders(); 
        } else {
          alert(`QWQER Dispatch Failed:\n${data.detail || data.message}`);
        }
      } catch (err) {
        alert("Network error. Failed to contact QWQER API.");
      } finally {
        setLoading(false);
      }
      return; 
    }

    // =================================================================
    // 🧑‍🍳 STANDARD STATUS UPDATES (Confirmed -> Preparing, etc.)
    // =================================================================
    let nextStatus = "";
    if (status === "confirmed") nextStatus = "preparing"; 
    else if (status === "pending") nextStatus = "confirmed"; 

    if (!nextStatus) return;

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/v1/outlet/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        fetchOrders(); 
      } else {
        alert("Failed to update status in the database.");
      }
    } catch (err) {
      alert("Network error. Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending": return "Accept Order";
      case "confirmed": return "Start Preparing";
      case "preparing": return "Call QWQER Rider";
      case "ready_for_pickup": return "Waiting for Rider...";
      case "out_for_delivery": return "Rider En Route";
      default: return "Update Status";
    }
  };

  const getStatusBadgeInfo = (status: string) => {
    const s = status?.toLowerCase() || "";
    switch (s) {
      case "pending": 
        return { text: "Pending", style: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "confirmed": 
        return { text: "Confirmed", style: "bg-blue-50 text-blue-700 border-blue-200" };
      case "preparing": 
        return { text: "Preparing", style: "bg-orange-50 text-orange-700 border-orange-200" };
      case "ready_for_pickup": 
        return { text: "Waiting for Rider", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "out_for_delivery": 
        return { text: "Out for Delivery", style: "bg-purple-50 text-purple-700 border-purple-200" };
      default: 
        return { text: status.replace(/_/g, ' ').toUpperCase(), style: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-red-600" />
            Active Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and update the status of your current orders.</p>
        </div>
        
        <button 
          onClick={fetchOrders} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : 'text-gray-400'}`} />
          Refresh List
        </button>
      </div>
      
      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Order #</th>
                <th scope="col" className="px-6 py-4 font-medium">Items</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Loading active orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <PackageOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No active orders at the moment.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const currentStatus = order.order_status || order.status;
                  const isWaitingForRider = ["ready_for_pickup", "out_for_delivery"].includes(currentStatus?.toLowerCase());
                  const badgeInfo = getStatusBadgeInfo(currentStatus);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group align-middle">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 tracking-tight">
                          #{order.order_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm text-gray-600 truncate">
                          {/* ✅ Includes Unit now. Example: "Product Name (2 x 500g)" */}
                          {order.order_items?.map((i: any) => 
                            `${i.product?.name || "Product"} (${i.quantity}${i.product?.unit ? ` x ${i.product.unit}` : ''})`
                          ).join(", ")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeInfo.style}`}>
                          {badgeInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(order.id, currentStatus)}
                            disabled={isWaitingForRider}
                            className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${
                              isWaitingForRider 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {!isWaitingForRider && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isWaitingForRider && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {getButtonText(currentStatus)}
                          </button>
                          
                          <Link 
                            href={`/outlet-home/orders/${order.id}`} 
                            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Details
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}