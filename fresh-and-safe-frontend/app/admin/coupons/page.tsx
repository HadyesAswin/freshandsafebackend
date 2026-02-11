"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CouponListPage() {
  const [coupons, setCoupons] = useState([]);
  const router = useRouter();

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/coupons/");
      setCoupons(res.data);
    } catch (err) {
      console.error("Failed to fetch coupons", err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons(); // Refresh list after delete
    } catch (err) {
      alert("Error deleting coupon");
    }
  };

  // Helper to format dates nicely
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Coupons</h1>
        <Link 
          href="/admin/coupons/add" 
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md transition-all active:scale-95"
        >
          + Create New Coupon
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Validity</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                
                {/* Coupon Code */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900 bg-gray-100 px-2 py-1 rounded inline-block border border-gray-300">
                    {c.code}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Used: {c.used_count} times</div>
                </td>

                {/* Discount Details */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-green-600">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                  </div>
                  {c.min_order_amount > 0 && (
                    <div className="text-xs text-gray-500">Min Order: ₹{c.min_order_amount}</div>
                  )}
                </td>

                {/* Date Range */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">From: {formatDate(c.valid_from)}</div>
                    <div className="text-xs text-gray-500">To: {formatDate(c.valid_to)}</div>
                </td>

                {/* Applicable Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {c.applicable_type}
                    </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.status ? 'Active' : 'Expired/Inactive'}
                  </span>
                </td>

                {/* Actions - HERE IS THE EDIT LOGIC */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button 
                    onClick={() => router.push(`/admin/coupons/add?id=${c.id}`)} 
                    className="text-indigo-600 hover:text-indigo-900 font-bold"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)} 
                    className="text-red-600 hover:text-red-900 font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {coupons.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                        No coupons found. Create your first discount code!
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}