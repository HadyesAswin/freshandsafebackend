"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function CouponFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "fixed", // "fixed" or "percentage"
    discount_value: "",
    min_order_amount: 0,
    max_discount_amount: "",
    usage_limit_per_user: 1,
    valid_from: "",
    valid_to: "",
    applicable_type: "all", // "all", "category", "product"
    status: true,
    category_ids: [] as number[],
    product_ids: [] as number[],
  });

  // Load Data (Categories, Products, and Coupon if editing)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, prodRes, couponsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/v1/categories/"),
          axios.get("http://localhost:8000/api/v1/products/"),
          axios.get("http://localhost:8000/api/v1/coupons/") 
        ]);

        setCategories(catRes.data);
        setProducts(prodRes.data);

        // Pre-fill Logic
        if (editingId) {
          const coupon = couponsRes.data.find((c: any) => c.id === parseInt(editingId));
          
          if (coupon) {
            // Format dates for input (YYYY-MM-DDThh:mm)
            const formatForInput = (dateStr: string) => {
                if (!dateStr) return "";
                return new Date(dateStr).toISOString().slice(0, 16);
            };

            setFormData({
              code: coupon.code,
              description: coupon.description || "",
              discount_type: coupon.discount_type,
              discount_value: coupon.discount_value.toString(),
              min_order_amount: coupon.min_order_amount,
              max_discount_amount: coupon.max_discount_amount ? coupon.max_discount_amount.toString() : "",
              usage_limit_per_user: coupon.usage_limit_per_user,
              valid_from: formatForInput(coupon.valid_from),
              valid_to: formatForInput(coupon.valid_to),
              applicable_type: coupon.applicable_type,
              status: coupon.status,
              
              // Map nested objects to simple arrays of IDs
              category_ids: coupon.categories ? coupon.categories.map((c: any) => c.category_id || c.category?.id) : [],
              product_ids: coupon.products ? coupon.products.map((p: any) => p.product_id || p.product?.id) : [],
            });
          }
        }
      } catch (err) {
        console.error("Error loading data", err);
      }
    };

    loadData();
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    
    // Prepare Payload
    const payload: any = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount.toString()),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        // Ensure dates are ISO format for backend
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
    };

    try {
      if (editingId) {
         // If editing, delete old and create new to handle complex relations easily
         await axios.delete(`http://localhost:8000/api/v1/coupons/${editingId}`, {
             headers: { Authorization: `Bearer ${token}` }
         });
         await axios.post("http://localhost:8000/api/v1/coupons/", payload, {
             headers: { Authorization: `Bearer ${token}` }
         });
      } else {
         await axios.post("http://localhost:8000/api/v1/coupons/", payload, {
            headers: { Authorization: `Bearer ${token}` }
         });
      }
      
      router.push("/admin/coupons");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error saving coupon");
    } finally {
      setLoading(false);
    }
  };

  // Styling Helpers
  const inputClass = "w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8 space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back</button>
        <h1 className="text-2xl font-bold text-slate-800">{editingId ? "Edit Coupon" : "Create New Coupon"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6 border-t-4 border-green-600">
        
        {/* Section: Code & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className={labelClass}>Coupon Code</label>
                <input 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    className={`${inputClass} font-mono font-bold tracking-wider uppercase`} 
                    placeholder="SUMMER25" 
                    required 
                />
            </div>
            <div>
                <label className={labelClass}>Discount Type</label>
                <select 
                    value={formData.discount_type} 
                    onChange={e => setFormData({...formData, discount_type: e.target.value})} 
                    className={inputClass}
                >
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                </select>
            </div>
        </div>

        {/* Section: Value & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className={labelClass}>Discount Value</label>
                <input 
                    type="number" 
                    value={formData.discount_value} 
                    onChange={e => setFormData({...formData, discount_value: e.target.value})} 
                    className={inputClass} 
                    required 
                />
            </div>
            <div>
                <label className={labelClass}>Min Order Amount</label>
                <input 
                    type="number" 
                    value={formData.min_order_amount} 
                    // FIX: Handle empty string safely
                    onChange={e => setFormData({
                        ...formData, 
                        min_order_amount: e.target.value === "" ? 0 : parseFloat(e.target.value)
                    })} 
                    className={inputClass} 
                />
            </div>
            <div>
                <label className={labelClass}>Usage Limit (Per User)</label>
                <input 
                    type="number" 
                    value={formData.usage_limit_per_user} 
                    // FIX: Handle empty string safely
                    onChange={e => setFormData({
                        ...formData, 
                        usage_limit_per_user: e.target.value === "" ? 0 : parseInt(e.target.value)
                    })} 
                    className={inputClass} 
                />
            </div>
        </div>

        {/* Section: Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50 p-6 rounded-xl border border-green-100">
            <div>
                <label className={labelClass}>Valid From</label>
                <input type="datetime-local" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} className={inputClass} required />
            </div>
            <div>
                <label className={labelClass}>Valid To</label>
                <input type="datetime-local" value={formData.valid_to} onChange={e => setFormData({...formData, valid_to: e.target.value})} className={inputClass} required />
            </div>
        </div>

        {/* Section: Applicability Logic */}
        <div className="border-t pt-6">
            <label className="block text-lg font-bold text-gray-800 mb-4">Applicable To</label>
            <div className="flex space-x-8 mb-6">
                {['all', 'category', 'product'].map(type => (
                    <label key={type} className="flex items-center space-x-3 cursor-pointer capitalize group">
                        <input 
                            type="radio" 
                            name="app_type" 
                            checked={formData.applicable_type === type} 
                            onChange={() => setFormData({...formData, applicable_type: type})} 
                            className="h-5 w-5 text-green-600 focus:ring-green-500"
                        />
                        <span className="font-medium text-gray-700 group-hover:text-green-700">{type === 'all' ? 'Entire Store' : `Specific ${type}`}</span>
                    </label>
                ))}
            </div>

            {/* Conditional Dropdowns */}
            {formData.applicable_type === 'category' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <label className={labelClass}>Select Categories (Hold Ctrl to select multiple)</label>
                    <select 
                        multiple 
                        className={`${inputClass} h-40`} 
                        value={formData.category_ids.map(String)} // Convert numbers to strings for select value
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                            setFormData({...formData, category_ids: selected});
                        }}
                    >
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple items.</p>
                </div>
            )}

            {formData.applicable_type === 'product' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <label className={labelClass}>Select Products (Hold Ctrl to select multiple)</label>
                    <select 
                        multiple 
                        className={`${inputClass} h-40`} 
                        value={formData.product_ids.map(String)}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                            setFormData({...formData, product_ids: selected});
                        }}
                    >
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple items.</p>
                </div>
            )}
        </div>

        <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-all active:scale-95 text-lg"
        >
            {loading ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
        </button>
      </form>
    </div>
  );
}

export default function AddCouponPage() {
    return <Suspense fallback={<div>Loading form...</div>}><CouponFormContent /></Suspense>;
}