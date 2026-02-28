"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Ticket, 
  Percent, 
  IndianRupee, 
  Calendar, 
  Users, 
  Layers, 
  Loader2, 
  Save, 
  CheckCircle2, 
  Info 
} from "lucide-react";

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
    discount_type: "fixed", 
    discount_value: "",
    min_order_amount: 0,
    max_discount_amount: "",
    usage_limit_per_user: 1,
    valid_from: "",
    valid_to: "",
    applicable_type: "all", 
    status: true,
    category_ids: [] as number[],
    product_ids: [] as number[],
  });

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

        if (editingId) {
          const coupon = couponsRes.data.find((c: any) => c.id === parseInt(editingId));
          
          if (coupon) {
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
    const token = localStorage.getItem("admin_token");
    
    const payload: any = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount.toString()),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
    };

    try {
      if (editingId) {
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

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-red-600" />
            {editingId ? "Edit Coupon" : "Create New Coupon"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure discount codes, validity dates, and store applicability.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-10">
        
        {/* Section 1: Identity & Type */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            {/* <Tag className="w-4 h-4 text-red-500" /> */}
            <h2>Code & Discount Type</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className={labelClass}>Coupon Code</label>
                  <input 
                      value={formData.code} 
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                      className={`${inputClass} font-mono font-bold tracking-widest text-red-600 placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal`} 
                      placeholder="e.g. SAVE20" 
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
        </div>

        {/* Section 2: Financial Limits */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            <IndianRupee className="w-4 h-4 text-red-500" />
            <h2>Value & Usage Limits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className={labelClass}>Discount Value</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      {formData.discount_type === 'percentage' ? <Percent className="w-3.5 h-3.5" /> : <IndianRupee className="w-3.5 h-3.5" />}
                    </span>
                    <input 
                        type="number" 
                        value={formData.discount_value} 
                        onChange={e => setFormData({...formData, discount_value: e.target.value})} 
                        className={`${inputClass} pl-9`} 
                        placeholder="0"
                        required 
                    />
                  </div>
              </div>
              <div>
                  <label className={labelClass}>Min Order Amount (₹)</label>
                  <input 
                      type="number" 
                      value={formData.min_order_amount} 
                      onChange={e => setFormData({
                          ...formData, 
                          min_order_amount: e.target.value === "" ? 0 : parseFloat(e.target.value)
                      })} 
                      className={inputClass} 
                  />
              </div>
              <div>
                  <label className={labelClass}>Usage Limit (Per User)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Users className="w-3.5 h-3.5" />
                    </span>
                    <input 
                        type="number" 
                        value={formData.usage_limit_per_user} 
                        onChange={e => setFormData({
                            ...formData, 
                            usage_limit_per_user: e.target.value === "" ? 0 : parseInt(e.target.value)
                        })} 
                        className={`${inputClass} pl-9`} 
                    />
                  </div>
              </div>
          </div>
        </div>

        {/* Section 3: Validity */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            <Calendar className="w-4 h-4 text-red-500" />
            <h2>Duration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-red-50/50 p-6 rounded-xl border border-red-100/50">
              <div>
                  <label className={labelClass}>Valid From</label>
                  <input type="datetime-local" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} className={inputClass} required />
              </div>
              <div>
                  <label className={labelClass}>Valid To</label>
                  <input type="datetime-local" value={formData.valid_to} onChange={e => setFormData({...formData, valid_to: e.target.value})} className={inputClass} required />
              </div>
          </div>
        </div>

        {/* Section 4: Applicability */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
              <Layers className="w-4 h-4 text-red-500" />
              <h2>Applicable To</h2>
            </div>
            
            <div className="flex flex-wrap gap-3">
                {['all', 'category', 'product'].map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, applicable_type: type})}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                            formData.applicable_type === type 
                            ? 'bg-red-600 text-white border-red-600 shadow-md' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-red-200'
                        }`}
                    >
                        {type === 'all' ? 'Entire Store' : `Specific ${type}`}
                    </button>
                ))}
            </div>

            {/* Conditional Dropdowns */}
            {formData.applicable_type !== 'all' && (
                <div className="animate-in slide-in-from-top-2 duration-300 bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <label className={`${labelClass} flex items-center justify-between`}>
                        <span>Select {formData.applicable_type}s</span>
                        <span className="text-[10px] font-normal normal-case text-gray-400">Hold Ctrl / Cmd to select multiple</span>
                    </label>
                    <select 
                        multiple 
                        className={`${inputClass} h-48 bg-white focus:bg-white`} 
                        value={formData.applicable_type === 'category' ? formData.category_ids.map(String) : formData.product_ids.map(String)}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                            if (formData.applicable_type === 'category') {
                                setFormData({...formData, category_ids: selected});
                            } else {
                                setFormData({...formData, product_ids: selected});
                            }
                        }}
                    >
                        {formData.applicable_type === 'category' 
                          ? categories.map((c: any) => <option key={c.id} value={c.id} className="p-2 border-b border-gray-50 last:border-0">{c.name}</option>)
                          : products.map((p: any) => <option key={p.id} value={p.id} className="p-2 border-b border-gray-50 last:border-0">{p.name}</option>)
                        }
                    </select>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5" />
            <span>Dates will be saved in UTC format.</span>
          </div>
          <button 
              type="submit" 
              disabled={loading} 
              className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {editingId ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  {editingId ? "Update Coupon" : "Create Coupon"}
                </>
              )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddCouponPage() {
    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-sm font-medium">Loading form...</p>
        </div>
      }>
        <CouponFormContent />
      </Suspense>
    );
}