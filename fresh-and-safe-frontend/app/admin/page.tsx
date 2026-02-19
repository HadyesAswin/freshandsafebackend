"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  pending_orders: number;
  total_customers: number;
}

export default function AdminDashboard() {
  // Initialize with 0s to prevent hydration errors or undefined property crashes
  const [stats, setStats] = useState<DashboardStats>({
    total_orders: 0,
    total_revenue: 0,
    total_products: 0,
    pending_orders: 0,
    total_customers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/dashboard/stats", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Welcome Back, Admin!
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Here is what's happening with your store today.
        </p>
      </header>
      
      {/* Updated Grid for 3 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Total Revenue Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-green-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Revenue</h3>
          <p className="text-4xl font-black text-slate-800 mt-3">
            ₹{loading ? "..." : stats.total_revenue.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center text-green-600 text-xs font-bold">
            <span>Live from all outlets</span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Orders</h3>
          <p className="text-4xl font-black text-slate-800 mt-3">
            {loading ? "..." : stats.total_orders.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center text-blue-600 text-xs font-bold">
            <span>Completed & Processing</span>
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-purple-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Active Customers</h3>
          <p className="text-4xl font-black text-slate-800 mt-3">
            {loading ? "..." : stats.total_customers.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center text-purple-600 text-xs font-bold">
            <span>Registered Users</span>
          </div>
        </div>

      </div>

      {/* Placeholder for future charts or Recent Activity */}
      <div className="mt-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Recent Activity & Analytics Coming Soon
        </p>
      </div>
    </div>
  );
}