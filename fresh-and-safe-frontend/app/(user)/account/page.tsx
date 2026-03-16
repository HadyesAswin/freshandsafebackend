"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// ✅ Dynamically import the map so it doesn't break Server-Side Rendering (SSR)
const MapPicker = dynamic(() => import("../../../components/MapPicker"), { ssr: false });

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "addresses">("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // ✅ NEW: SMS Subscription State
  const [isSmsSubscribed, setIsSmsSubscribed] = useState(false);
  const [isUpdatingSms, setIsUpdatingSms] = useState(false);
  
  // Location Tracking State for Address Book
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  // ✅ Pin Verification State
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);
  const [sessionZip, setSessionZip] = useState("");

  // Edit Address State
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // ✅ Add Address State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zipcode: "", 
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const router = useRouter();

  const fetchUserData = async (userId: number) => {
    setLoadingData(true);
    try {
      const [ordersRes, addrRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/orders/my-orders/${userId}`),
        fetch(`http://localhost:8000/api/v1/orders/my-addresses/${userId}`)
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (addrRes.ok) setAddresses(await addrRes.json());
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const sessionZipcode = localStorage.getItem("zipcode") || ""; 
    setSessionZip(sessionZipcode);

    if (!storedUser) {
      router.push("/"); return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // ✅ Sync local state with user data from DB
    setIsSmsSubscribed(parsedUser.sms_subscription || false);
    
    // ✅ Initialize new address zipcode from session
    setNewAddress(prev => ({ ...prev, zipcode: sessionZipcode }));
    
    fetchUserData(parsedUser.id);
  }, [router]);

  // ✅ Toggle SMS Subscription Logic
  const handleSmsToggle = async () => {
    setIsUpdatingSms(true);
    const newStatus = !isSmsSubscribed;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/otp/update-sms-subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id, 
          status: newStatus 
        }),
      });

      if (res.ok) {
        setIsSmsSubscribed(newStatus);
        const updatedUser = { ...user, sms_subscription: newStatus };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        alert("Failed to update subscription preference.");
      }
    } catch (error) {
      console.error("SMS Update Error:", error);
    } finally {
      setIsUpdatingSms(false);
    }
  };

  // ✅ TIGHTENED: Now checks the first 4 digits to ensure it's within the same town/city (~10-15km radius)
  const verifyLocationPin = async (lat: number, lng: number, isEdit: boolean) => {
      setIsLocating(true);
      setLocationError("");
      setPinVerified(null);

      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          
          if (data && data.address && data.address.postcode) {
              const mappedZip = data.address.postcode;
              
              if (mappedZip !== sessionZip) {
                  // ✅ Checking first 4 digits for a stricter boundary limit
                  if (mappedZip.substring(0, 4) === sessionZip.substring(0, 4)) {
                      setPinVerified(true);
                      setLocationError(""); 
                  } else {
                      setPinVerified(false);
                      setLocationError(`Mismatched Location! The map pin (${mappedZip}) is too far from your selected store area (${sessionZip}). Delivery is limited to ~15km.`);
                      return; // Stop them from continuing
                  }
              } else {
                  setPinVerified(true);
                  setLocationError("");
              }

              // Auto-fill City/State from map data if adding new
              if (!isEdit) {
                  setNewAddress(prev => ({
                      ...prev,
                      city: data.address.city || data.address.town || data.address.county || "",
                      state: data.address.state || "Kerala",
                      latitude: lat,
                      longitude: lng
                  }));
              } else {
                  setEditingAddress((prev: any) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng
                  }));
              }
          } else {
              setPinVerified(true); // Allow if OSM doesn't have pincode data for that exact rural pixel
              if (!isEdit) setNewAddress(prev => ({ ...prev, latitude: lat, longitude: lng }));
              else setEditingAddress((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
          }
      } catch (err) {
          console.error("Geocoding failed", err);
          // Allow fallback if api is down
          setPinVerified(true);
          if (!isEdit) setNewAddress(prev => ({ ...prev, latitude: lat, longitude: lng }));
          else setEditingAddress((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
      } finally {
          setIsLocating(false);
      }
  };

  const handleGetExactLocation = (isEdit: boolean) => {
    setIsLocating(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("GPS is not supported by your device/browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        verifyLocationPin(position.coords.latitude, position.coords.longitude, isEdit);
      },
      (error) => {
        setIsLocating(false);
        setLocationError("Location access denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinVerified) {
        alert("Please set a valid map location before saving.");
        return;
    }
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, user_id: user.id })
      });
      if (res.ok) {
        alert("New Address Saved!");
        setShowAddForm(false);
        setPinVerified(null);
        setNewAddress({ name: "", phone: "", email: "", address_line1: "", address_line2: "", city: "", state: "", zipcode: sessionZip, latitude: null, longitude: null });
        fetchUserData(user.id);
      } else {
        const errorData = await res.json();
        alert("Failed to save address: " + (errorData.detail || "Server error"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinVerified === false) {
        alert("Please fix map location before saving.");
        return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses/${editingAddress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAddress)
      });
      if (res.ok) {
        alert("Address Updated Successfully!");
        setEditingAddress(null);
        setPinVerified(null);
        fetchUserData(user.id); 
      } else {
        alert("Failed to update address.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Address deleted successfully!");
        fetchUserData(user.id);
      } else {
        alert("Failed to delete address.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return { text: "Unknown", styles: "bg-gray-100 text-gray-800" };
    const s = status.toLowerCase();
    switch (s) {
      case "pending": return { text: "Payment Pending", styles: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "confirmed": return { text: "Order Confirmed", styles: "bg-blue-50 text-blue-700 border-blue-200" };
      case "delivered": return { text: "Delivered", styles: "bg-green-50 text-green-700 border-green-200" };
      case "cancelled": return { text: "Cancelled", styles: "bg-red-50 text-red-700 border-red-200" };
      default: return { text: status.replace(/_/g, ' ').toUpperCase(), styles: "bg-gray-100 text-gray-800" };
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">Fresh<span className="text-slate-800">&Safe</span></Link>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors">← Back to Store</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">

        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border p-6 space-y-2 h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-800">My Account</h2>
          <button onClick={() => {setActiveTab("dashboard"); setEditingAddress(null); setShowAddForm(false); setPinVerified(null)}} className={`block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${activeTab === "dashboard" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>Account Dashboard</button>
          <button onClick={() => {setActiveTab("orders"); setEditingAddress(null); setShowAddForm(false); setPinVerified(null)}} className={`block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors flex justify-between items-center ${activeTab === "orders" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
            My Orders {orders.length > 0 && <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{orders.length}</span>}
          </button>
          <button onClick={() => {setActiveTab("addresses"); setShowAddForm(false); setEditingAddress(null); setPinVerified(null)}} className={`block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${activeTab === "addresses" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>Address Book</button>
          
          <button onClick={() => router.push("/wishlist")} className="block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors text-gray-600 hover:bg-gray-50">
            My Wishlist
          </button>

          <hr className="my-4 border-gray-100" />
          <button onClick={() => { localStorage.clear(); router.push("/"); }} className="block w-full text-left px-4 py-3 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors">Logout</button>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-8 min-h-[500px]">

          {activeTab === "dashboard" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-black mb-8 text-gray-800">Welcome, {user.name || "User"}!</h1>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-xl p-6 h-fit">
                  <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">Profile Information</h3>
                  <p className="font-semibold text-gray-800">{user.name || "Not provided"}</p>
                  <p className="text-gray-600 mt-1">📞 {user.phone}</p>
                  <p className="text-gray-600 mt-1">✉️ {user.email || "Not provided"}</p>
                </div>

                <div className="border rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">SMS Subscription</h3>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Subscribe/Unsubscribe for Offers and Promotions</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isSmsSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {isSmsSubscribed ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={isSmsSubscribed} onChange={handleSmsToggle} disabled={isUpdatingSms} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 transition-colors"></div>
                    </label>
                  </div>
                  {isUpdatingSms && <p className="text-[10px] text-blue-500 font-bold mt-2 animate-pulse">Updating preference...</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-black mb-6 text-gray-800">My Orders</h1>
              {loadingData ? <p>Loading orders...</p> : orders.length === 0 ? <p>No orders yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm border-b border-t">
                        <th className="p-4 font-bold">Order ID</th>
                        <th className="p-4 font-bold">Items</th>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Total</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const badge = getStatusBadge(order.status);
                        return (
                          <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors text-sm">
                            <td className="p-4 font-semibold text-gray-800">{order.order_number}</td>
                            <td className="p-4">
                              {order.first_item_name ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800 line-clamp-1">{order.first_item_name}</span>
                                  {order.items_count > 1 && <span className="text-[10px] font-bold text-gray-400">+{order.items_count - 1} more</span>}
                                </div>
                              ) : <span className="text-gray-600">{order.items_count} Items</span>}
                            </td>
                            <td className="p-4 text-gray-600">{order.date}</td>
                            <td className="p-4 font-bold text-gray-800">₹{order.total_amount}</td>
                            <td className="p-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.styles}`}>{badge.text}</span></td>
                            <td className="p-4 text-right">
                              <Link href={`/order/${order.order_number}`} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-200 transition">View Details</Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-black text-gray-800">Address Book</h1>
                {!showAddForm && !editingAddress && (
                  <button onClick={() => {setShowAddForm(true); setPinVerified(null)}} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-700 transition-all">+ Add New Address</button>
                )}
              </div>
              
              {/* ✅ FORM: ADD NEW ADDRESS */}
              {showAddForm && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-10 shadow-sm animate-in slide-in-from-top duration-300">
                  <h3 className="font-black text-xl mb-6 text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg">+</span>
                    New Delivery Address
                  </h3>
                  
                  {/* Step 1: Force Map Interaction */}
                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
                      <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Step 1: Set Exact GPS Location</p>
                      
                      <button type="button" onClick={() => handleGetExactLocation(false)} disabled={isLocating} className="w-full mb-4 py-3.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-black transition-all bg-white text-blue-600 border-blue-200 hover:bg-blue-50 active:scale-[0.98]">
                        {isLocating ? "⏳ Locating Your Exact Spot..." : "📍 Detect My Live Location"}
                      </button>

                      <div className="rounded-2xl overflow-hidden border shadow-inner h-64 mb-4">
                         <MapPicker 
                            latitude={newAddress.latitude} 
                            longitude={newAddress.longitude} 
                            onChange={(lat, lng) => verifyLocationPin(lat, lng, false)} 
                        />
                      </div>

                      {locationError && (
                          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold">
                              {locationError}
                          </div>
                      )}
                      
                      {pinVerified && (
                          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-bold text-center">
                              ✅ Location Verified in Delivery Zone {sessionZip}
                          </div>
                      )}
                  </div>

                  {/* Step 2: Form Details (Disabled until Pin is Verified) */}
                  <form onSubmit={handleCreateAddress} className={`space-y-5 transition-opacity ${!pinVerified ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Step 2: Enter Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Recipient Name</label>
                        <input type="text" placeholder="Full Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="border w-full p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500 transition-all" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Phone Number</label>
                        <input type="text" placeholder="Phone" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="border w-full p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500 transition-all" required />
                      </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Address Detail (House/Flat/Street)</label>
                        <input type="text" placeholder="Address Line 1" value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} className="border w-full p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500 transition-all" required />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="border p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500" required />
                      <input type="text" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="border p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500" required />
                      
                      {/* ✅ ZIPCODE: READ ONLY */}
                      <div className="relative">
                        <input type="text" value={newAddress.zipcode} className="border w-full p-3.5 rounded-xl outline-none bg-gray-100 text-gray-500 font-bold cursor-not-allowed" readOnly />
                        <span className="absolute -top-2 left-3 bg-gray-100 px-1 text-[9px] font-black text-gray-400 rounded">LOCKED ZIPCODE</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                      <button type="submit" disabled={!pinVerified} className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-black hover:bg-green-700 shadow-lg shadow-green-100 transition-all disabled:bg-gray-300 disabled:shadow-none">Save New Address</button>
                      <button type="button" onClick={() => {setShowAddForm(false); setPinVerified(null)}} className="px-10 py-3.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all pointer-events-auto opacity-100">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* ✅ FORM: EDIT ADDRESS */}
              {editingAddress ? (
                <div className="bg-gray-50 p-6 rounded-2xl border mb-10 shadow-sm animate-in slide-in-from-top duration-300">
                  <h3 className="font-black text-xl mb-6 text-gray-800">Edit Address</h3>
                  
                  {/* Step 1: Force Map Interaction */}
                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
                      <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Step 1: Verify Map Location</p>
                      
                      <button type="button" onClick={() => handleGetExactLocation(true)} disabled={isLocating} className="w-full mb-4 py-3.5 border-2 rounded-xl flex items-center justify-center gap-2 font-black transition-all bg-white text-blue-600 border-blue-200 hover:bg-blue-50">
                        {isLocating ? "⏳ Updating GPS..." : "📍 Re-Detect Live Location"}
                      </button>

                      <div className="rounded-2xl overflow-hidden border h-64 mb-4">
                         <MapPicker 
                            latitude={editingAddress.latitude} 
                            longitude={editingAddress.longitude} 
                            onChange={(lat, lng) => verifyLocationPin(lat, lng, true)} 
                        />
                      </div>

                      {locationError && (
                          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold">
                              {locationError}
                          </div>
                      )}
                      
                      {pinVerified === true && (
                          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-bold text-center">
                              ✅ Location Verified
                          </div>
                      )}
                  </div>

                  <form onSubmit={handleUpdateAddress} className={`space-y-5 transition-opacity ${pinVerified === false ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Step 2: Update Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Name" value={editingAddress.name} onChange={e => setEditingAddress({...editingAddress, name: e.target.value})} className="border p-3.5 rounded-xl outline-none bg-white" required />
                      <input type="text" placeholder="Phone" value={editingAddress.phone} onChange={e => setEditingAddress({...editingAddress, phone: e.target.value})} className="border p-3.5 rounded-xl outline-none bg-white" required />
                    </div>
                    <input type="text" placeholder="Address" value={editingAddress.address_line1} onChange={e => setEditingAddress({...editingAddress, address_line1: e.target.value})} className="border w-full p-3.5 rounded-xl outline-none bg-white" required />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <input type="text" placeholder="City" value={editingAddress.city} onChange={e => setEditingAddress({...editingAddress, city: e.target.value})} className="border p-3.5 rounded-xl outline-none bg-white" required />
                      <input type="text" placeholder="State" value={editingAddress.state} onChange={e => setEditingAddress({...editingAddress, state: e.target.value})} className="border p-3.5 rounded-xl outline-none bg-white" required />
                      <input type="text" value={editingAddress.zipcode} className="border p-3.5 rounded-xl outline-none bg-gray-100 text-gray-400 font-bold cursor-not-allowed" readOnly />
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                      <button type="submit" disabled={pinVerified === false} className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-black hover:bg-green-700 disabled:bg-gray-300">Save Changes</button>
                      <button type="button" onClick={() => {setEditingAddress(null); setPinVerified(null)}} className="px-10 py-3.5 bg-white border rounded-xl font-bold pointer-events-auto opacity-100">Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ✅ ADDRESS LIST DISPLAY */
                !showAddForm && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {addresses.length === 0 ? (
                      <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-medium italic">No addresses saved. Click "Add New Address" to get started.</p>
                      </div>
                    ) : addresses.map((addr) => (
                      <div key={addr.id} className="border rounded-2xl p-6 hover:border-green-500 transition-all relative bg-white shadow-sm hover:shadow-xl hover:shadow-green-100 group">
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => {setEditingAddress(addr); setPinVerified(true);}} className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-3 py-1 rounded-full hover:bg-green-100">Edit</button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100">Delete</button>
                        </div>

                        <p className="font-black text-gray-900 mb-1 text-lg">{addr.name}</p>
                        <p className="text-gray-500 text-xs mb-4 font-bold flex items-center gap-1">📞 {addr.phone}</p>
                        <div className="space-y-1">
                          <p className="text-gray-600 text-sm leading-relaxed">{addr.address_line1}</p>
                          <p className="text-gray-600 text-sm">{addr.city}, {addr.state}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-50">
                          <p className="text-gray-900 font-black text-xs">PIN: {addr.zipcode}</p>
                          {addr.latitude && <span className="text-[9px] font-black text-green-700 uppercase bg-green-100 px-2 py-0.5 rounded shadow-sm">📍 GPS Saved</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}