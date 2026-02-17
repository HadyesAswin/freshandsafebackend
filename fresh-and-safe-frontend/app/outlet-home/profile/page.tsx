"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-800 mb-6">👤 Shop Profile</h1>

      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        
        {/* Status Message */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-bold ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Outlet Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name</label>
            <input
              type="text"
              name="outlet_name"
              value={formData.outlet_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Email (Read Only) */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-500 mb-1">Email (Read-only)</label>
            <input
              type="text"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          {/* Zipcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zipcode</label>
            <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
          
           {/* Landmark */}
           <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
            <input type="text" name="landmark" value={formData.landmark || ""} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          {/* Submit Button */}
          <div className="col-span-2 mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 disabled:opacity-50 transition shadow-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}