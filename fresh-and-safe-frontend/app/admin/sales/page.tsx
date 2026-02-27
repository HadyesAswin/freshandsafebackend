"use client";

import { useEffect, useState } from "react";
import { Download, IndianRupee, ShoppingCart, Loader2 } from "lucide-react";

export default function AdminSalesPage() {
  // ✅ FIX: Initialize state with default structure so .map() and .summary never fail
  const [data, setData] = useState<any>({
    summary: { total_orders: 0, total_revenue: 0 },
    orders: [],
    pagination: { total: 0, page: 1, last_page: 1 }
  });
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    outlet_id: "",
    year: "2026",
    month: "",
    date: "",
    page: 1
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/outlets")
      .then(res => res.json())
      .then(setOutlets)
      .catch(err => console.error("Error loading outlets:", err));
  }, []);

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        year: filters.year,
        ...(filters.outlet_id && { outlet_id: filters.outlet_id }),
        ...(filters.month && { month: filters.month }),
        ...(filters.date && { specific_date: filters.date }),
      });

      const res = await fetch(`http://localhost:8000/api/v1/sales/overview?${params}`);
      const result = await res.json();
      
      // Ensure we always have an array for orders to prevent crashes
      setData({
        summary: result.summary || { total_orders: 0, total_revenue: 0 },
        orders: result.orders || [],
        pagination: result.pagination || { total: 0, page: 1, last_page: 1 }
      });
    } catch (error) {
      console.error("Sales fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data.orders || data.orders.length === 0) return;
    const headers = "Order #,Customer,Amount,Status,Date\n";
    const rows = data.orders.map((o: any) => 
      `${o.order_number},"${o.customer}",${o.amount},${o.status},${o.date}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Track your revenue and order volume across outlets.</p>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={data.orders.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
              ₹{loading ? "..." : (data.summary?.total_revenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
             <IndianRupee className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-gray-500 text-sm font-medium">Orders Count</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
              {loading ? "..." : data.summary?.total_orders || 0}
            </p>
          </div>
           <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
             <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Container */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Outlet Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Select Outlet</label>
            <select 
              onChange={(e) => setFilters({...filters, outlet_id: e.target.value, page: 1})}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-colors"
            >
              <option value="">All Shops</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.outlet_name}</option>)}
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Specific Date</label>
            <input 
              type="date" 
              onChange={(e) => setFilters({...filters, date: e.target.value, page: 1})}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-colors"
            />
          </div>

          {/* Month Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Filter by Month</label>
            <select 
              onChange={(e) => setFilters({...filters, month: e.target.value, page: 1})}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-colors"
            >
              <option value="">Full Year</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Order Number</th>
                <th scope="col" className="px-6 py-4 font-medium">Customer</th>
                <th scope="col" className="px-6 py-4 font-medium">Amount</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                    <p className="mt-3 text-sm text-gray-500 font-medium">Loading sales data...</p>
                  </td>
                </tr>
              ) : data.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500 font-medium">No orders found for these filters.</p>
                  </td>
                </tr>
              ) : (
                data.orders.map((o: any) => (
                  <tr key={o.order_number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {o.order_number}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {o.customer}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₹{o.amount}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                         o.status.toLowerCase() === 'delivered' 
                         ? 'bg-green-50 text-green-700 border-green-200' 
                         : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                       }`}>
                         {o.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-right whitespace-nowrap">
                      {o.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50 gap-4">
          <span className="text-sm text-gray-500">
            Showing Page <span className="font-medium text-gray-900">{filters.page}</span> of <span className="font-medium text-gray-900">{data.pagination?.last_page || 1}</span>
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              disabled={filters.page === 1 || loading}
              onClick={() => setFilters({...filters, page: filters.page - 1})}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={filters.page >= (data.pagination?.last_page || 1) || loading}
              onClick={() => setFilters({...filters, page: filters.page + 1})}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}