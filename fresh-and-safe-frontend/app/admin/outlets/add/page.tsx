"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function OutletFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    outlet_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    state: "",
    zipcode: "",
    landmark: "",
    latitude: "",
    longitude: "",
    status: true,
  });

  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/outlets/").then((res) => {
        const item = res.data.find((o: any) => o.id === parseInt(editingId));
        if (item) {
          setFormData({
            ...item,
            password: "", // Security: Don't show hashed password
            latitude: item.latitude || "",
            longitude: item.longitude || "",
          });
        }
      });
    }
  }, [editingId]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    // Prepare payload
    const payload: any = { ...formData };
    
    // Convert numbers
    if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
    else delete payload.latitude;
    
    if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
    else delete payload.longitude;

    // Handle Password Logic
    if (editingId && !payload.password) {
        delete payload.password; // Don't send empty password on edit
    }

    try {
      const url = editingId
        ? `http://localhost:8000/api/v1/outlets/${editingId}`
        : "http://localhost:8000/api/v1/outlets/";

      await axios({
        method: editingId ? "put" : "post",
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/admin/outlets");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error saving outlet");
    } finally {
      setLoading(false);
    }
  };

  // Reusable Tailwind classes
  const inputClass = "w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8 space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back</button>
        <h1 className="text-2xl font-bold text-slate-800">{editingId ? "Edit Outlet" : "Create New Outlet"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6 border-t-4 border-blue-600">
        
        {/* Section: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Outlet Name</label>
            <input name="outlet_name" value={formData.outlet_name} onChange={handleChange} className={inputClass} placeholder="e.g. Downtown Branch" required />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+1 234 567 890" required />
          </div>
        </div>

        {/* Section: Credentials */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-blue-800 font-bold mb-4 text-sm uppercase tracking-wide">Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Login Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="branch@freshsafe.com" required />
                </div>
                <div>
                    <label className={labelClass}>Password {editingId && <span className="text-xs font-normal text-gray-500">(Leave blank to keep current)</span>}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} required={!editingId} />
                </div>
            </div>
        </div>

        {/* Section: Address */}
        <div>
            <label className={labelClass}>Full Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} className={`${inputClass} h-24`} placeholder="Street address, building number..." required />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={labelClass}>City</label><input name="city" value={formData.city} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass}>District</label><input name="district" value={formData.district} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass}>State</label><input name="state" value={formData.state} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass}>Zipcode</label><input name="zipcode" value={formData.zipcode} onChange={handleChange} className={inputClass} required /></div>
        </div>

        {/* Section: Location & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            <div><label className={labelClass}>Latitude</label><input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className={inputClass} placeholder="10.8505" /></div>
            <div><label className={labelClass}>Longitude</label><input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className={inputClass} placeholder="76.2711" /></div>
            
            <div className="flex items-center justify-center h-full pt-6">
                <label className="flex items-center cursor-pointer space-x-3">
                    <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="h-6 w-6 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="font-bold text-gray-700">Active Outlet</span>
                </label>
            </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95 text-lg">
          {loading ? "Saving..." : editingId ? "Update Outlet" : "Create Outlet"}
        </button>
      </form>
    </div>
  );
}

export default function AddOutletPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OutletFormContent />
    </Suspense>
  );
}