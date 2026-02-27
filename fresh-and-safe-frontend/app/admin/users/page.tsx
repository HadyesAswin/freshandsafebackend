"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Phone, Calendar, Loader2, RotateCcw } from "lucide-react";

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
    <div className="animate-in fade-in duration-500 pb-10 space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and filter registered customers and staff.</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm w-full sm:w-auto justify-center">
          <Users className="w-4 h-4" />
          Total: {userData.pagination.total_count || 0} Users
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-end gap-4 md:gap-6">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500">Filter by Month</label>
            <div className="flex gap-2">
              <select 
                value={year} 
                onChange={(e) => { handleFilterChange('year', e.target.value); setSpecificDate(""); }}
                className="w-1/3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-colors"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select 
                value={month} 
                onChange={(e) => { handleFilterChange('month', e.target.value); setSpecificDate(""); }}
                className="w-2/3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-colors"
              >
                <option value="">All Months</option>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500">Or Specific Date</label>
            <input 
              type="date" 
              value={specificDate}
              onChange={(e) => { handleFilterChange('date', e.target.value); setMonth(""); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-colors"
            />
          </div>

          <button 
            onClick={() => { setMonth(""); setYear("2026"); setSpecificDate(""); setPage(1); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium text-center w-16">ID</th>
                <th scope="col" className="px-6 py-4 font-medium">User Details</th>
                <th scope="col" className="px-6 py-4 font-medium">Contact</th>
                <th scope="col" className="px-6 py-4 font-medium">Role</th>
                <th scope="col" className="px-6 py-4 font-medium">Joined Date</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                    <p className="mt-3 text-sm text-gray-500 font-medium">Loading users...</p>
                  </td>
                </tr>
              ) : userData.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500 font-medium">No users found for these filters.</p>
                  </td>
                </tr>
              ) : (
                userData.users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-center text-gray-400 font-medium text-xs">
                      #{user.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{user.full_name}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {user.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-wider">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {user.created_at}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.is_active 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
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
            Page <span className="font-medium text-gray-900">{userData.pagination.current_page || 1}</span> of <span className="font-medium text-gray-900">{userData.pagination.total_pages || 1}</span>
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={page >= (userData.pagination.total_pages || 1) || loading}
              onClick={() => setPage(page + 1)}
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