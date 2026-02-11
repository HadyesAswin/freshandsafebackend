"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function DealFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id"); // URL ?id=123
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // State matches the backend schema
  const [formData, setFormData] = useState({
    product_id: "",
    offer_price: ""
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
      // We fetch all deals and find the one we need (Simple method)
      axios.get("http://localhost:8000/api/v1/daily-deals/")
        .then(res => {
          const deal = res.data.find((d: any) => d.id === parseInt(editingId));
          if (deal) {
            setFormData({
              product_id: deal.product_id.toString(),
              offer_price: deal.offer_price.toString()
            });
          }
        });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    // Convert strings to numbers for backend
    const payload = {
        product_id: parseInt(formData.product_id),
        offer_price: parseFloat(formData.offer_price)
    };

    try {
      if (editingId) {
        // UPDATE MODE (PUT)
        await axios.put(`http://localhost:8000/api/v1/daily-deals/${editingId}`, payload, {
           headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // CREATE MODE (POST)
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

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center mb-8 space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back</button>
        <h1 className="text-2xl font-bold text-slate-800">{editingId ? "Edit Deal" : "Create New Deal"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6 border-t-4 border-orange-500">
        
        {/* Product Dropdown */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Product</label>
          <select 
            value={formData.product_id} 
            onChange={e => setFormData({...formData, product_id: e.target.value})} 
            className="w-full border p-3 rounded-lg bg-white"
            required
          >
            <option value="">-- Choose a Product --</option>
            {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                    {p.name} (Original: ₹{p.price})
                </option>
            ))}
          </select>
        </div>

        {/* Offer Price Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Offer Price (₹)</label>
          <input 
            type="number" 
            step="0.01"
            value={formData.offer_price} 
            onChange={e => setFormData({...formData, offer_price: e.target.value})} 
            className="w-full border p-3 rounded-lg font-mono text-lg" 
            placeholder="e.g. 99.00"
            required 
          />
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-lg transition-all">
          {loading ? "Saving..." : editingId ? "Update Deal" : "Activate Deal"}
        </button>
      </form>
    </div>
  );
}

export default function AddDealPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <DealFormContent />
    </Suspense>
  );
}