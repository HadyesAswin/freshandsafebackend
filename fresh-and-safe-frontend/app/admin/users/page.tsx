"use client";

import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [userData, setUserData] = useState<any>({ users: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination States
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("page_size", "10");

      if (specificDate) {
        queryParams.append("specific_date", specificDate);
      } else {
        if (year) queryParams.append("year", year);
        if (month) queryParams.append("month", month);
      }

      const res = await fetch(`http://localhost:8000/api/v1/admin/users?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [year, month, specificDate, page]);

  // Reset to page 1 when filters change
  const handleFilterChange = (type: string, value: string) => {
    setPage(1);
    if (type === 'year') setYear(value);
    if (type === 'month') setMonth(value);
    if (type === 'date') setSpecificDate(value);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">User Management</h1>
          <p className="text-gray-500 font-medium">View and filter registered customers and staff.</p>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm">
          Total: {userData.pagination.total_count || 0} Users
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8 flex flex-wrap gap-6 items-end">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter by Month</label>
          <div className="flex gap-2">
            <select 
              value={year} 
              onChange={(e) => { handleFilterChange('year', e.target.value); setSpecificDate(""); }}
              className="border bg-gray-50 px-4 py-2 rounded-lg outline-none font-bold text-sm"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <select 
              value={month} 
              onChange={(e) => { handleFilterChange('month', e.target.value); setSpecificDate(""); }}
              className="border bg-gray-50 px-4 py-2 rounded-lg outline-none font-bold text-sm"
            >
              <option value="">All Months</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Or Specific Date</label>
          <input 
            type="date" 
            value={specificDate}
            onChange={(e) => { handleFilterChange('date', e.target.value); setMonth(""); }}
            className="border bg-gray-50 px-4 py-2 rounded-lg outline-none font-bold text-sm"
          />
        </div>

        <button 
          onClick={() => { setMonth(""); setYear("2026"); setSpecificDate(""); setPage(1); }}
          className="text-gray-400 hover:text-red-500 text-sm font-bold pb-2"
        >
          Reset Filters
        </button>
      </div>

      {/* --- USERS TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="p-6 text-center">ID</th>
              <th className="p-6">User Details</th>
              <th className="p-6">Contact</th>
              <th className="p-6">Role</th>
              <th className="p-6">Joined Date</th>
              <th className="p-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center font-bold text-gray-400">Loading...</td></tr>
            ) : userData.users.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400">No users found.</td></tr>
            ) : (
              userData.users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 text-center text-gray-400 font-bold text-xs">#{user.id}</td>
                  <td className="p-6">
                    <div className="font-bold text-slate-800">{user.full_name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="p-6 font-black text-slate-700 text-sm">{user.phone}</td>
                  <td className="p-6">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100">{user.role}</span>
                  </td>
                  <td className="p-6 text-sm font-bold text-slate-500">{user.created_at}</td>
                  <td className="p-6 text-right">
                    <span className={`text-xs font-bold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* --- PAGINATION CONTROLS --- */}
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Page {userData.pagination.current_page} of {userData.pagination.total_pages || 1}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-white border rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={page >= userData.pagination.total_pages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}