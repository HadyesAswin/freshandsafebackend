"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 Important for navigation

export default function DailyDealsListPage() {
  const [deals, setDeals] = useState([]);
  const router = useRouter(); // 👈 Initialize the router

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
      fetchDeals(); // Refresh list after delete
    } catch (err) {
      alert("Error deleting deal");
    }
  };

  // ✅ THE EDIT FUNCTION
  const handleEdit = (dealId: number) => {
    // This pushes the user to the Add Page, but with an ID attached.
    // The Add Page detects this ID and switches to "Edit Mode".
    router.push(`/admin/daily-deals/add?id=${dealId}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daily Deals Management</h1>
        <Link 
          href="/admin/daily-deals/add" 
          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 shadow-md transition-transform active:scale-95"
        >
          + Create New Deal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal: any) => (
          <div key={deal.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-start space-x-4 hover:shadow-lg transition-shadow">
            
            {/* Product Image Preview */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                {deal.product?.image ? (
                  <img 
                    src={`http://localhost:8000${deal.product.image}`} 
                    alt={deal.product.name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs text-center p-1">No Image</div>
                )}
            </div>

            {/* Deal Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate" title={deal.product?.name}>
                {deal.product?.name || `Product ID: ${deal.product_id}`}
              </h3>
              
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-gray-400 line-through text-sm">
                  ₹{deal.product?.price}
                </span>
                <span className="text-orange-600 font-bold text-lg">
                  ₹{deal.offer_price}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-3">
                <button 
                  onClick={() => handleEdit(deal.id)} 
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(deal.id)} 
                  className="text-sm font-bold text-red-500 hover:text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {deals.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
            <p className="text-gray-500 font-medium">No deals active right now.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Create New Deal" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}