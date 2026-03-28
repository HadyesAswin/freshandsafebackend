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
  CheckCircle2,
  Store // ✅ Added Store icon for the switch
} from "lucide-react";

export default function ShopHomePage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: Status States for the ON/OFF Toggle
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

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

  // ✅ NEW: Fetch Initial Store Status
  const fetchStatus = async () => {
    const token = localStorage.getItem("outlet_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/outlet/orders/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOnline(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch status", err);
    }
  };

  // ✅ NEW: Toggle Store Status (ON/OFF)
  const handleToggleStatus = async () => {
    setIsToggling(true);
    const token = localStorage.getItem("outlet_token");
    const newStatus = !isOnline;
    
    try {
      const res = await fetch("http://localhost:8000/api/v1/outlet/orders/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        setIsOnline(newStatus);
      } else {
        alert("Failed to update store status.");
      }
    } catch (err) {
      alert("Network error. Could not reach the server.");
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    fetchStatus(); // ✅ Call fetchStatus when page loads
    fetchOrders();

    const ws = new WebSocket("ws://localhost:8000/ws/orders");

    ws.onopen = () => {
      console.log("🟢 WebSocket Connected to Orders Live Stream");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_order") {
          console.log("🔥 New order received in outlet");
          // Slight delay to ensure database committed the transaction
          setTimeout(() => {
            fetchOrders();
          }, 1000); 
        }
      } catch (e) {
        console.error("Error parsing WebSocket message", e);
      }
    };

    ws.onerror = () => {
      // ✅ FIX: Silence the empty '{}' object spam. 
      // This is a harmless side effect of React Strict Mode reloading.
      console.warn("⚠️ WebSocket connection hiccup (Normal during dev hot-reloads).");
    };

    ws.onclose = () => {
      console.log("🔴 WebSocket Disconnected");
    };

    return () => {
      // ✅ FIX: Only close if it's actually open or connecting to avoid crash
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  // ✅ NEW 1-CLICK ACCEPT & DISPATCH
  const updateStatus = async (orderId: number, currentStatus: string) => {
    const token = localStorage.getItem("outlet_token");
    const status = currentStatus?.toLowerCase();

    // ✅ FIX: Allow action if the order is Pending OR Confirmed (Paid)
    if (status === "pending" || status === "confirmed") {
      if (!window.confirm("Accepting this order will automatically dispatch a QWQER rider. Are you sure it's ready?")) return;

      try {
        setLoading(true);
        // Skip manual updates and immediately call QWQER Dispatch!
        const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/dispatch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        });

        const data = await res.json();

        if (res.ok) {
          alert(`Order Accepted! QWQER driver assigned.\nTracking Key: ${data.qwqer_details.order_key}`);
          fetchOrders(); 
        } else {
          alert(`QWQER Dispatch Failed:\n${data.detail || data.message}`);
        }
      } catch (err) {
        alert("Network error. Failed to contact QWQER API.");
      } finally {
        setLoading(false);
      }
    }
  };

  const getButtonText = (order: any) => {
    const s = (order.order_status || order.status)?.toLowerCase();
    
    // ✅ FIX: Show "Accept Order" for both pending and confirmed orders
    if ((s === "pending" || s === "confirmed") && !order.qwqer_order_id) {
      return "Accept Order";
    }
    
    // If it's anything else, it's out of the manager's hands
    if (order.qwqer_order_id || ["preparing", "ready_for_pickup"].includes(s)) {
      return "Waiting for Rider...";
    }
    
    return "Processing...";
  };

  const getStatusBadgeInfo = (status: string) => {
    const s = status?.toLowerCase() || "";
    switch (s) {
      case "pending": 
      case "confirmed": // ✅ FIX: Map Confirmed to "New Order"
        return { text: "New Order", style: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "preparing": 
      case "ready_for_pickup": 
        return { text: "Rider Assigned", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "out_for_delivery": 
        return { text: "Out for Delivery", style: "bg-purple-50 text-purple-700 border-purple-200" };
      default: 
        return { text: status.replace(/_/g, ' ').toUpperCase(), style: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-red-600" />
            Active Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and update the status of your current orders.</p>
        </div>
        
        {/* ✅ NEW: Top Action Bar containing the Toggle & Refresh buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          
          {/* The ON/OFF Switch */}
          <div className={`flex items-center gap-3 px-4 py-2 border rounded-xl shadow-sm flex-1 md:flex-none justify-between transition-colors ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex items-center gap-2">
              <Store className={`w-4 h-4 ${isOnline ? 'text-emerald-600' : 'text-gray-500'}`} />
              <span className={`text-sm font-bold tracking-wide uppercase ${isOnline ? 'text-emerald-700' : 'text-gray-500'}`}>
                {isOnline ? 'Store OPEN' : 'Store CLOSED'}
              </span>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                isOnline ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-400 hover:bg-gray-500'
              }`}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  isOnline ? 'translate-x-6' : 'translate-x-1'
                }`} 
              />
            </button>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={fetchOrders} 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 h-[42px] w-12 md:w-auto flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : 'text-gray-400'}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
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
                  const currentStatus = (order.order_status || order.status)?.toLowerCase();
                  
                  // ✅ FIX: Button is only locked if Qwqer is dispatched OR status is past 'confirmed'
                  const isWaitingForRider = !["pending", "confirmed"].includes(currentStatus) || !!order.qwqer_order_id;
                  
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
                            {getButtonText(order)}
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