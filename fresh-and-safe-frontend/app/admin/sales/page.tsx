"use client";

import { useEffect, useState } from "react";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Sales Overview</h1>
          <p className="text-slate-500 font-medium">Track your revenue and order volume across outlets.</p>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={data.orders.length === 0}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          📥 Export CSV Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-l-8 border-l-green-500">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Revenue</p>
          <p className="text-4xl font-black text-slate-800 mt-2">
            ₹{loading ? "..." : (data.summary?.total_revenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-l-8 border-l-blue-500">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Orders Count</p>
          <p className="text-4xl font-black text-slate-800 mt-2">
            {loading ? "..." : data.summary?.total_orders || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select Outlet</label>
          <select 
            onChange={(e) => setFilters({...filters, outlet_id: e.target.value, page: 1})}
            className="w-full border bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-green-500 appearance-none"
          >
            <option value="">All Shops</option>
            {outlets.map(o => <option key={o.id} value={o.id}>{o.outlet_name}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Specific Date</label>
          <input 
            type="date" 
            onChange={(e) => setFilters({...filters, date: e.target.value, page: 1})}
            className="w-full border bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Filter by Month</label>
          <select 
            onChange={(e) => setFilters({...filters, month: e.target.value, page: 1})}
            className="w-full border bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-green-500 appearance-none"
          >
            <option value="">Full Year</option>
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-6">Order Number</th>
                <th className="p-6">Customer</th>
                <th className="p-6">Amount</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Loading Sales Data...</p>
                  </td>
                </tr>
              ) : data.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 font-bold">
                    No orders found for this selection.
                  </td>
                </tr>
              ) : (
                data.orders.map((o: any) => (
                  <tr key={o.order_number} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6 font-black text-slate-700">{o.order_number}</td>
                    <td className="p-6 font-bold text-slate-600">{o.customer}</td>
                    <td className="p-6 font-black text-green-700 text-lg">₹{o.amount}</td>
                    <td className="p-6 text-center">
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${
                         o.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                       }`}>
                         {o.status}
                       </span>
                    </td>
                    <td className="p-6 text-sm text-slate-400 font-bold text-right">{o.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-6 border-t flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing Page {filters.page} of {data.pagination?.last_page || 1}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={filters.page === 1 || loading}
              onClick={() => setFilters({...filters, page: filters.page - 1})}
              className="px-6 py-2 bg-white border rounded-xl font-bold text-xs hover:bg-slate-50 transition-all disabled:opacity-30 active:scale-95"
            >
              Previous
            </button>
            <button 
              disabled={filters.page >= (data.pagination?.last_page || 1) || loading}
              onClick={() => setFilters({...filters, page: filters.page + 1})}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-black transition-all disabled:opacity-30 active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}