"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Ticket, Calendar, BarChart3, Tag } from "lucide-react";

export default function CouponListPage() {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  // Fetch Coupons, Products, and Categories simultaneously
  const fetchData = async () => {
    try {
      const [couponsRes, productsRes, categoriesRes] = await Promise.all([
        axios.get("http://localhost:8000/api/v1/coupons/"),
        axios.get("http://localhost:8000/api/v1/products/"),
        axios.get("http://localhost:8000/api/v1/categories/")
      ]);
      setCoupons(couponsRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    const token = localStorage.getItem("admin_token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); 
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

  // ✅ SUPERCHARGED HELPER: Perfectly maps nested Pydantic schemas
  const getApplicableNames = (coupon: any) => {
    if (coupon.applicable_type === 'product') {
      const pList = coupon.products || coupon.product_ids || [];
      if (Array.isArray(pList) && pList.length > 0) {
        return pList.map((item: any) => {
          // ✅ Catch the newly loaded nested backend data (item.product.name)
          if (item.product?.name) return item.product.name;
          
          // Fallback to searching our products list if it's just an ID
          const id = item.product?.id || item.product_id || item.id || item;
          const matched = products.find(p => p.id === id);
          return matched ? matched.name : `Product #${id}`;
        }).join(', ');
      }
      return "Specific Products";
    }
    
    if (coupon.applicable_type === 'category') {
      const cList = coupon.categories || coupon.category_ids || [];
      if (Array.isArray(cList) && cList.length > 0) {
        return cList.map((item: any) => {
          // ✅ Catch the newly loaded nested backend data (item.category.name)
          if (item.category?.name) return item.category.name;
          
          // Fallback to searching our categories list if it's just an ID
          const id = item.category?.id || item.category_id || item.id || item;
          const matched = categories.find(c => c.id === id);
          return matched ? matched.name : `Category #${id}`;
        }).join(', ');
      }
      return "Specific Categories";
    }
    
    return "All Store Items";
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
                <th scope="col" className="px-6 py-4 font-medium w-1/4">Applies To</th>
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
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group align-top">
                    
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

                    {/* Applicable Type & EXACT Names */}
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 mb-1">
                            {c.applicable_type}
                        </span>
                        
                        <div className="text-xs text-gray-800 font-semibold leading-relaxed mt-1">
                          {getApplicableNames(c)}
                        </div>
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