"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Store, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Map, 
  Compass, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Define the shape of our Profile Data
interface OutletProfile {
  outlet_name: string;
  email: string; // Read-only
  phone: string;
  address: string;
  city: string;
  district: string;
  state: string;
  zipcode: string;
  landmark?: string;
}

export default function OutletProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<OutletProfile>({
    outlet_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    state: "",
    zipcode: "",
    landmark: "",
  });

  // 1. Fetch Profile Data on Load
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("outlet_token");
      if (!token) {
        router.push("/shop-login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/v1/outlet/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setFormData(data); // Fill the form with DB data
        } else {
          throw new Error("Failed to load profile");
        }
      } catch (err) {
        setMessage({ type: "error", text: "Could not load profile data." });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // 2. Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Save/Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const token = localStorage.getItem("outlet_token");

    try {
      const res = await fetch("http://localhost:8000/api/v1/outlet/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            // Exclude email from the update payload
            outlet_name: formData.outlet_name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            district: formData.district,
            state: formData.state,
            zipcode: formData.zipcode,
            landmark: formData.landmark
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  // Standardized styling classes
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3 pl-10";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-red-600" />
            Shop Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your outlet's display name, contact information, and physical location.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
        
        {/* Status Message */}
        {message && (
          <div
            className={`flex items-center gap-3 p-4 mb-8 rounded-lg text-sm font-medium border ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outlet Name */}
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Outlet Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Store className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="outlet_name"
                  value={formData.outlet_name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className={labelClass}>Email Address <span className="text-gray-400 normal-case tracking-normal">(Read-only)</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={formData.email}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 text-sm rounded-lg outline-none p-3 pl-10 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Address Header */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 mt-2 flex items-center gap-2 text-gray-900 font-semibold">
              <MapPin className="w-4 h-4 text-red-500" />
              <h3>Location Details</h3>
            </div>

            {/* Address */}
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Street Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className={labelClass}>City</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  className={inputClass} 
                />
              </div>
            </div>

            {/* District */}
            <div>
              <label className={labelClass}>District</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Map className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  name="district" 
                  value={formData.district} 
                  onChange={handleChange} 
                  className={inputClass} 
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className={labelClass}>State</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Map className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleChange} 
                  className={inputClass} 
                />
              </div>
            </div>

            {/* Zipcode */}
            <div>
              <label className={labelClass}>Zipcode / PIN Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  name="zipcode" 
                  value={formData.zipcode} 
                  onChange={handleChange} 
                  className={inputClass} 
                />
              </div>
            </div>
            
            {/* Landmark */}
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Landmark <span className="text-gray-400 normal-case tracking-normal">(Optional)</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Compass className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  name="landmark" 
                  value={formData.landmark || ""} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="e.g. Near City Mall"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 min-w-[180px]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}