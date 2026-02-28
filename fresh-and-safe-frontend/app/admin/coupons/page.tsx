"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Ticket, Calendar, BarChart3, Tag } from "lucide-react";

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
    
    const token = localStorage.getItem("admin_token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons(); 
    } catch (err) {
      alert("Error deleting coupon");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-red-600" />
            Manage Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for your customers.</p>
        </div>
        <Link 
          href="/admin/coupons/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Code</th>
                <th scope="col" className="px-6 py-4 font-medium">Discount</th>
                <th scope="col" className="px-6 py-4 font-medium">Validity</th>
                <th scope="col" className="px-6 py-4 font-medium">Type</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                     <Tag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                     <p className="text-sm text-gray-500 font-medium">No coupons found. Create your first discount code!</p>
                  </td>
                </tr>
              ) : (
                coupons.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    
                    {/* Coupon Code */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center font-mono font-bold text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-100 border-dashed">
                        {c.code}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1.5 font-medium uppercase tracking-wider">
                        <BarChart3 className="w-3 h-3" /> Used {c.used_count} times
                      </div>
                    </td>

                    {/* Discount Details */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </div>
                      {c.min_order_amount > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5 font-medium italic">Min Order: ₹{c.min_order_amount}</div>
                      )}
                    </td>

                    {/* Validity Range */}
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs font-medium">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Calendar className="w-3 h-3 text-gray-400" /> {formatDate(c.valid_from)}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <span className="w-3 h-0.5 bg-gray-200 ml-0.5"></span> {formatDate(c.valid_to)}
                          </div>
                        </div>
                    </td>

                    {/* Applicable Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100">
                            {c.applicable_type}
                        </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        c.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {c.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/coupons/add?id=${c.id}`)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Coupon"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}