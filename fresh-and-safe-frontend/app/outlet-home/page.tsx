"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

        // ✅ Since Pydantic uses alias="status", we check both keys just in case
        const activeOrders = data
          .filter(
            (o: any) => !["delivered", "out_for_delivery"].includes(o.order_status || o.status)
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
    
    // Logic for next status transition
    let nextStatus = "";
    const status = currentStatus?.toLowerCase();
    
    if (status === "pending") nextStatus = "confirmed";
    else if (status === "confirmed") nextStatus = "preparing";
    else if (status === "preparing") nextStatus = "out_for_delivery";
    else if (status === "out_for_delivery") nextStatus = "delivered";

    if (!nextStatus) return;

    try {
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
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // ✅ Helper to handle Button Text
  const getButtonText = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending": return "Accept Order";
      case "confirmed": return "Start Preparing";
      case "preparing": return "Ready for Delivery";
      case "out_for_delivery": return "Mark Delivered";
      default: return "Update Status";
    }
  };

  // ✅ Helper for Status Badge Colors
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending": return "bg-red-100 text-red-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "preparing": return "bg-yellow-100 text-yellow-700";
      case "out_for_delivery": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Active Orders</h1>
        <button onClick={fetchOrders} className="text-sm text-blue-600 hover:underline">
          Refresh List
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Order #</th>
                <th className="p-4 font-semibold text-gray-600">Items</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">Loading...</td></tr>
              ) : orders.map((order: any) => {
                // ✅ Extract status from either possible key
                const currentStatus = order.order_status || order.status;

                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-green-700">{order.order_number}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {order.order_items?.map((i: any) => 
                        `${i.product?.name || "Product"} (x${i.quantity})`
                      ).join(", ")}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full uppercase font-medium ${getStatusStyle(currentStatus)}`}>
                        {currentStatus || "Unknown"}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => updateStatus(order.id, currentStatus)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 font-medium transition"
                      >
                        {getButtonText(currentStatus)}
                      </button>
                      <Link 
                        href={`/outlet-home/orders/${order.id}`} 
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && !loading && (
          <div className="p-10 text-center text-gray-500 bg-gray-50">
            No active orders.
          </div>
        )}
      </div>
    </div>
  );
}