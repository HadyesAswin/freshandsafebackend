"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Zap, Image as ImageIcon, Tag } from "lucide-react";

export default function DailyDealsListPage() {
  const [deals, setDeals] = useState([]);
  const router = useRouter();

  const fetchDeals = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/daily-deals/");
      setDeals(res.data);
    } catch (err) {
      console.error("Failed to fetch deals", err);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this deal?")) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/daily-deals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDeals();
    } catch (err) {
      alert("Error deleting deal");
    }
  };

  const handleEdit = (dealId: number) => {
    router.push(`/admin/daily-deals/add?id=${dealId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-red-600 fill-red-600" />
            Daily Deals
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage time-limited offers and special product discounts.</p>
        </div>
        <Link 
          href="/admin/daily-deals/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create New Deal
        </Link>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.length > 0 ? (
          deals.map((deal: any) => {
            // Calculate discount percentage for a better "Deal" look
            const discount = deal.product?.price 
              ? Math.round(((deal.product.price - deal.offer_price) / deal.product.price) * 100) 
              : 0;

            return (
              <div key={deal.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                {discount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                    {discount}% OFF
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Product Image Preview */}
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 group-hover:border-red-100 transition-colors">
                      {deal.product?.image ? (
                        <img 
                          src={`http://localhost:8000${deal.product.image}`} 
                          alt={deal.product.name}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                  </div>

                  {/* Deal Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate pr-10" title={deal.product?.name}>
                      {deal.product?.name || `Product ID: ${deal.product_id}`}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-red-600 font-bold text-xl">
                        ₹{deal.offer_price}
                      </span>
                      <span className="text-gray-400 line-through text-xs font-medium">
                        {deal.product?.price}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 mt-4">
                      <button 
                        onClick={() => handleEdit(deal.id)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-100 rounded-md transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(deal.id)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-100 rounded-md transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center space-y-3">
             <div className="p-4 bg-gray-50 rounded-full">
                <Tag className="w-8 h-8 text-gray-300" />
             </div>
             <div className="text-center">
                <p className="text-gray-900 font-semibold">No active deals</p>
                <p className="text-sm text-gray-500">Create your first daily deal to see it here.</p>
             </div>
             <Link 
              href="/admin/daily-deals/add" 
              className="text-red-600 font-bold text-sm hover:underline"
            >
              + Create New Deal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}