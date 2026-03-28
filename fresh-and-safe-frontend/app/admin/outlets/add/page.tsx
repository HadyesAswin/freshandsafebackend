"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Store, Lock, MapPin, Loader2, Save } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map to prevent Server-Side Rendering (SSR) errors
const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

function OutletFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);

  const [adminPassword, setAdminPassword] = useState("");
const [showPasswordModal, setShowPasswordModal] = useState(false);
const [passwordError, setPasswordError] = useState("");
const [message, setMessage] = useState("");

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

  const submitOutlet = async () => {
  setLoading(true);
  setMessage("");

  const token = localStorage.getItem("admin_token");

  const payload: any = { ...formData };

  if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
  else delete payload.latitude;

  if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
  else delete payload.longitude;

  if (editingId && !payload.password) {
    delete payload.password;
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

    setMessage("Outlet updated successfully ✅");

    setTimeout(() => {
      router.push("/admin/outlets");
    }, 1500);

  } catch (err: any) {
    setMessage("❌ " + (err.response?.data?.detail || "Error saving outlet"));
  } finally {
    setLoading(false);
  }
};
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (editingId) {
    setShowPasswordModal(true); // 🔐 open password modal
  } else {
    submitOutlet(); // direct create
  }
};

const handleSubmitWithPassword = async () => {
  const token = localStorage.getItem("admin_token");

  try {
    await axios.post(
      "http://localhost:8000/api/v1/auth/verify-password",
      { password: adminPassword },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setShowPasswordModal(false);
    setAdminPassword("");
    setPasswordError("");

    await submitOutlet();

  } catch (err: any) {
    setPasswordError(err.response?.data?.detail || "Invalid password");
  }
};

  // Reusable Tailwind classes matching the minimal theme
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Go Back"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {editingId ? "Edit Outlet" : "Create New Outlet"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? "Update the details for this location." : "Fill in the details to add a new store location."}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded bg-green-50 text-green-600 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Section: Basic Info */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
            <Store className="w-5 h-5 text-gray-400" />
            <h2>Basic Information</h2>
          </div>
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
        </div>

        {/* Section: Credentials */}
        <div className="bg-red-50/50 p-6 rounded-xl border border-red-100">
          <div className="flex items-center gap-2 mb-4 text-red-800 font-semibold">
            <Lock className="w-5 h-5 text-red-400" />
            <h2>Login Credentials</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Login Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="branch@freshsafe.com" required />
            </div>
            <div>
              <label className={labelClass}>
                Password {editingId && <span className="font-normal text-gray-400 normal-case tracking-normal ml-1">(Leave blank to keep current)</span>}
              </label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} required={!editingId} placeholder="••••••••" />
            </div>
          </div>
        </div>

        {/* Section: Address */}
        <div>
           <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h2>Location Details</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Full Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} className={`${inputClass} min-h-[100px] resize-y`} placeholder="Street address, building number..." required />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={labelClass}>City</label><input name="city" value={formData.city} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>District</label><input name="district" value={formData.district} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>State</label><input name="state" value={formData.state} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Zipcode</label><input name="zipcode" value={formData.zipcode} onChange={handleChange} className={inputClass} required /></div>
            </div>

            {/* Interactive Map */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-gray-900">Pinpoint Location</h3>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                  Click on the map to auto-fill coordinates
                </span>
              </div>
              
              <LocationPicker 
                lat={formData.latitude} 
                lng={formData.longitude} 
                onLocationSelect={(lat, lng) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    latitude: lat.toFixed(6), 
                    longitude: lng.toFixed(6) 
                  }));
                }} 
              />
            </div>

            {/* Manual Lat/Long Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div>
                <label className={labelClass}>Latitude</label>
                <input 
                  type="number" 
                  step="any" 
                  name="latitude" 
                  value={formData.latitude} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="e.g. 10.850512" 
                />
              </div>
              <div>
                <label className={labelClass}>Longitude</label>
                <input 
                  type="number" 
                  step="any" 
                  name="longitude" 
                  value={formData.longitude} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="e.g. 76.271113" 
                />
              </div>
              
              <div className="flex items-center justify-start md:justify-center h-full pt-4 md:pt-6">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="peer sr-only" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
                  <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Active Outlet
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 bg-red-600 text-white rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {editingId ? "Update Outlet" : "Create Outlet"}
              </>
            )}
          </button>
        </div>
      </form>
      {showPasswordModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-80">
      
      <h3 className="font-semibold mb-3">Enter Admin Password</h3>

      {passwordError && (
        <p className="text-red-500 text-sm mb-2">{passwordError}</p>
      )}

      <input
        type="password"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
        placeholder="Enter password"
      />

      <div className="flex justify-end gap-2">
        <button onClick={() => setShowPasswordModal(false)}>Cancel</button>

        <button
          onClick={handleSubmitWithPassword}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default function AddOutletPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        <span className="text-sm font-medium">Loading form...</span>
      </div>
    }>
      <OutletFormContent />
    </Suspense>
  );
}