"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; // ✅ Added Link
import { IndianRupee, ShoppingCart, Users, Activity, ExternalLink } from "lucide-react"; // ✅ Added ExternalLink icon

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
        const token = localStorage.getItem("admin_token");
        
        const res = await fetch("http://localhost:8000/api/v1/dashboard/stats", {
          headers: { "Authorization": `Bearer ${token}` }
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
    <div className="animate-in fade-in duration-500">
      
      {/* ✅ UPDATED HEADER: Flex container to push the button to the right */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome Back, Admin!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here is what's happening with your store today.
          </p>
        </div>
        
        {/* ✅ VISIT SITE BUTTON */}
        <Link 
          href="/" 
          target="_blank" // Opens in a new tab
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm w-fit"
        >
          <ExternalLink className="w-4 h-4" />
          Visit Site
        </Link>
      </header>
      
      {/* Updated Grid for 3 Stats Cards - Clean and Minimal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                ₹{loading ? "..." : stats.total_revenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-gray-500 text-xs">
            <span className="text-red-600 font-medium mr-1">Live</span> from all outlets
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                {loading ? "..." : stats.total_orders.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-gray-500 text-xs">
            <span className="text-red-600 font-medium mr-1">All</span> completed & processing
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Active Customers</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                {loading ? "..." : stats.total_customers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-gray-500 text-xs">
            <span className="text-red-600 font-medium mr-1">Total</span> registered users
          </div>
        </div>

      </div>

      {/* Placeholder for future charts or Recent Activity */}
      <div className="mt-8 bg-gray-50/50 border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="p-4 bg-white rounded-full shadow-sm border border-gray-100">
            <Activity className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium text-sm">
          Recent Activity & Analytics Coming Soon
        </p>
      </div>
    </div>
  );
}