"use client";
import { useEffect, useState } from "react";

export default function ShopHomePage() {
  const [outletId, setOutletId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("outlet_id");
    setOutletId(storedId);
  }, []);

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold text-green-700 mb-2">
        🏪 Outlet Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        Welcome back! Manage your store efficiently.
      </p>

      {/* Outlet Info */}
      {outletId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Logged in as Outlet ID:
            <span className="ml-2 font-semibold text-green-700">
              {outletId}
            </span>
          </p>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Card */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-2">📦 Products</h2>
          <p className="text-gray-500 text-sm">
            Manage your product listings.
          </p>
          <p className="mt-4 text-2xl font-bold text-green-600">0</p>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-2">🛒 Orders</h2>
          <p className="text-gray-500 text-sm">
            View and manage customer orders.
          </p>
          <p className="mt-4 text-2xl font-bold text-green-600">0</p>
        </div>

        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold mb-2">💰 Revenue</h2>
          <p className="text-gray-500 text-sm">
            Track your earnings.
          </p>
          <p className="mt-4 text-2xl font-bold text-green-600">₹0</p>
        </div>
      </div>
    </div>
  );
}
