"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ShopHomePage() {
  const router = useRouter();
  const [outletId, setOutletId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Initial Data (ID + Status)
  useEffect(() => {
    const storedId = localStorage.getItem("outlet_id");
    const token = localStorage.getItem("outlet_token");
    
    if (!token) {
        router.push("/shop-login");
        return;
    }

    setOutletId(storedId);

    // Fetch current status from API
    const fetchStatus = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/outlet/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsShopOpen(data.status); // Set toggle based on DB
            }
        } catch (err) {
            console.error("Failed to fetch status");
        } finally {
            setLoading(false);
        }
    };

    fetchStatus();
  }, [router]);

  // 2. Handle Toggle Switch
  const toggleShopStatus = async () => {
    const token = localStorage.getItem("outlet_token");
    const newStatus = !isShopOpen; // Flip status

    // Optimistic UI Update (Change switch immediately)
    setIsShopOpen(newStatus);

    try {
        const res = await fetch("http://localhost:8000/api/v1/outlet/status", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
            throw new Error("Failed to update");
        }
    } catch (err) {
        // Revert if API fails
        setIsShopOpen(!newStatus);
        alert("Failed to update shop status. Please try again.");
    }
  };

  return (
    <div>
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-green-700 mb-1">
                🏪 Outlet Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
                Manage your store, orders, and products.
            </p>
        </div>

        {/* --- LIVE TOGGLE SWITCH --- */}
        {!loading && (
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-sm transition-all ${isShopOpen ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Shop Status</span>
                    <span className={`font-bold text-lg ${isShopOpen ? "text-green-700" : "text-red-600"}`}>
                        {isShopOpen ? "● LIVE / OPEN" : "○ CLOSED"}
                    </span>
                </div>
                
                {/* Switch UI */}
                <button 
                    onClick={toggleShopStatus}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${isShopOpen ? "bg-green-600" : "bg-gray-300"}`}
                >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isShopOpen ? "translate-x-6" : "translate-x-0"}`}></div>
                </button>
            </div>
        )}
      </div>

      {/* --- OUTLET INFO BAR --- */}
      {outletId && (
        <div className="mb-8 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-800">
            <span>🆔 Outlet ID: <strong>{outletId}</strong></span>
        </div>
      )}

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-gray-500 font-medium text-sm">Total Products</h2>
                <p className="mt-2 text-3xl font-bold text-gray-800">0</p>
            </div>
            <span className="text-2xl">📦</span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-gray-500 font-medium text-sm">New Orders</h2>
                <p className="mt-2 text-3xl font-bold text-gray-800">0</p>
            </div>
            <span className="text-2xl">🛒</span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
           <div className="flex justify-between items-start">
            <div>
                <h2 className="text-gray-500 font-medium text-sm">Today's Revenue</h2>
                <p className="mt-2 text-3xl font-bold text-green-600">₹0</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>
      </div>
    </div>
  );
}