"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Zap, 
  ShoppingBag, 
  Loader2, 
  Save, 
  CheckCircle2 
} from "lucide-react";

function DealFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id"); 
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    product_id: ""
  });

  // 1. Fetch Products for Dropdown
  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/products/")
      .then(res => setProducts(res.data))
      .catch(err => console.error("Failed to load products", err));
  }, []);

  // 2. Fetch Deal Data if Editing
  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/daily-deals/")
        .then(res => {
          const deal = res.data.find((d: any) => d.id === parseInt(editingId));
          if (deal) {
            setFormData({
              product_id: deal.product_id.toString()
            });
          }
        });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");

    // ✅ Find the selected product's original price to satisfy the backend DB requirement safely
    const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
    const originalPrice = selectedProduct ? selectedProduct.price : 0;

    const payload = {
        product_id: parseInt(formData.product_id),
        offer_price: parseFloat(originalPrice)
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/api/v1/daily-deals/${editingId}`, payload, {
           headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("http://localhost:8000/api/v1/daily-deals/", payload, {
           headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      router.push("/admin/daily-deals");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving deal");
    } finally {
      setLoading(false);
    }
  };

  // Reusable styling
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-red-600 fill-red-600" />
            {editingId ? "Edit Daily Deal Product" : "Create New Deal"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? "Change the product featured in this deal slot." : "Select a product to be featured in the Daily Deals section."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Product Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            <ShoppingBag className="w-4 h-4 text-red-500" />
            <h2>Product Selection</h2>
          </div>
          
          <div>
            <label className={labelClass}>Select Product</label>
            <div className="relative">
              <select 
                value={formData.product_id} 
                onChange={e => setFormData({...formData, product_id: e.target.value})} 
                className={`${inputClass} appearance-none pr-10`}
                required
              >
                <option value="">-- Choose a Product --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (MRP: ₹{p.price})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <ArrowLeft className="w-4 h-4 -rotate-90" />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 italic font-medium">
              * The standard MRP will be used. No custom offer price required.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.product_id} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-8 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {editingId ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {editingId ? "Update Deal" : "Activate Deal"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddDealPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <DealFormContent />
    </Suspense>
  );
}