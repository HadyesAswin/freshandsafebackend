"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Heart, HeartCrack, Trash2, AlertCircle } from "lucide-react";

// ✅ Dynamically import the map so it doesn't break Server-Side Rendering (SSR)
const MapPicker = dynamic(() => import("../../../components/MapPicker"), { ssr: false });

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image?: string;
  unit?: string;
  is_available?: boolean;
}

export default function AccountPageMobile() {
  const router = useRouter();
  
  // --- CORE STATE ---
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "details" | "orders" | "addresses" | "wishlist">("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // --- WISHLIST STATE ---
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  // --- SMS SUBSCRIPTION STATE ---
  const [isSmsSubscribed, setIsSmsSubscribed] = useState(false);
  const [isUpdatingSms, setIsUpdatingSms] = useState(false);
  
  // --- LOCATION & ADDRESS STATES ---
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);
  const [sessionZip, setSessionZip] = useState("");
  const [editingAddress, setEditingAddress] = useState<any>(null);
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

  // --- DETAILS UPDATE STATE ---
  const [detailsForm, setDetailsForm] = useState({ name: "", email: "", phone: "" });

  // ================= FETCHING & INITIALIZATION =================
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

  const fetchWishlistData = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    const storedZip = localStorage.getItem("zipcode");

    if (storedUser) {
      const user = JSON.parse(storedUser);
      let fetchUrl = `http://localhost:8000/api/v1/wishlist/${user.id}`;
      if (storedZip && storedZip !== "undefined") {
          fetchUrl += `?zipcode=${storedZip}`;
      }

      fetch(fetchUrl)
        .then(res => res.json())
        .then(dbWishlist => {
          setWishlist(dbWishlist);
          localStorage.setItem("wishlist", JSON.stringify(dbWishlist));
          setLoadingWishlist(false);
        })
        .catch(() => setLoadingWishlist(false));
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const sessionZipcode = localStorage.getItem("zipcode") || ""; 
    setSessionZip(sessionZipcode);

    if (!storedUser) {
      router.push("/"); return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setDetailsForm({ name: parsedUser.name || "", email: parsedUser.email || "", phone: parsedUser.phone || "" });
    setIsSmsSubscribed(parsedUser.sms_subscription || false);
    setNewAddress(prev => ({ ...prev, zipcode: sessionZipcode }));
    
    fetchUserData(parsedUser.id);
    fetchWishlistData();

    // Listen for zipcode changes to re-verify wishlist availability
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zipcode') {
        setLoadingWishlist(true);
        fetchWishlistData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, fetchWishlistData]);

  // ================= WISHLIST LOGIC =================
  const removeFromWishlist = async (productId: number) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    if (user) {
      try {
        await fetch("http://localhost:8000/api/v1/wishlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            product_ids: updatedWishlist.map(item => item.id)
          })
        });
      } catch (error) {
        console.error("Wishlist sync failed", error);
      }
    }
  };

  // ================= DASHBOARD & DETAILS LOGIC =================
  const handleSmsToggle = async () => {
    setIsUpdatingSms(true);
    const newStatus = !isSmsSubscribed;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/otp/update-sms-subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, status: newStatus }),
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

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/${user.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(detailsForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("Details updated successfully!");
      } else {
        alert("Failed to update details.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // ================= ADDRESS LOGIC =================
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
                  if (mappedZip.substring(0, 4) === sessionZip.substring(0, 4)) {
                      setPinVerified(true);
                      setLocationError(""); 
                  } else {
                      setPinVerified(false);
                      setLocationError(`Location out of bounds! Pin (${mappedZip}) is too far from ${sessionZip}.`);
                      return; 
                  }
              } else {
                  setPinVerified(true);
                  setLocationError("");
              }

              if (!isEdit) {
                  setNewAddress(prev => ({
                      ...prev,
                      city: data.address.city || data.address.town || data.address.county || "",
                      state: data.address.state || "Kerala",
                      latitude: lat,
                      longitude: lng
                  }));
              } else {
                  setEditingAddress((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
              }
          } else {
              setPinVerified(true); 
              if (!isEdit) setNewAddress(prev => ({ ...prev, latitude: lat, longitude: lng }));
              else setEditingAddress((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
          }
      } catch (err) {
          console.error("Geocoding failed", err);
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
      setLocationError("GPS is not supported.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => verifyLocationPin(position.coords.latitude, position.coords.longitude, isEdit),
      (error) => { setIsLocating(false); setLocationError("Location access denied."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinVerified) return alert("Please set a valid map location.");
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, user_id: user.id })
      });
      if (res.ok) {
        setShowAddForm(false);
        setPinVerified(null);
        setNewAddress({ name: "", phone: "", email: "", address_line1: "", address_line2: "", city: "", state: "", zipcode: sessionZip, latitude: null, longitude: null });
        fetchUserData(user.id);
      } else {
        const errorData = await res.json();
        alert("Failed to save address: " + (errorData.detail || "Server error"));
      }
    } catch (error) { console.error(error); }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinVerified === false) return alert("Please fix map location.");
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses/${editingAddress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAddress)
      });
      if (res.ok) {
        setEditingAddress(null);
        setPinVerified(null);
        fetchUserData(user.id); 
      } else {
        alert("Failed to update address.");
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses/${addressId}`, { method: "DELETE" });
      if (res.ok) fetchUserData(user.id);
    } catch (error) { console.error(error); }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return { text: "Unknown", styles: "bg-slate-100 text-slate-800" };
    const s = status.toLowerCase();
    switch (s) {
      case "pending": return { text: "Payment Pending", styles: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "confirmed": return { text: "Confirmed", styles: "bg-blue-50 text-blue-700 border-blue-200" };
      case "delivered": return { text: "Delivered", styles: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "cancelled": return { text: "Canceled", styles: "bg-rose-50 text-rose-600 border-rose-100" };
      default: return { text: status.replace(/_/g, ' ').toUpperCase(), styles: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  if (!user) return null;

  const unavailableItemsCount = wishlist.filter(item => item.is_available === false).length;

  return (
    <div className="bg-[#fafaf9] min-h-screen text-[#1e293b] antialiased font-sans pb-20">
      
      {/* MOBILE HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">My Account</h1>
        <button onClick={handleLogout} className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
          Logout
        </button>
      </header>

      {/* MOBILE SWIPEABLE TAB NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="flex overflow-x-auto gap-2 p-3 scrollbar-hide snap-x">
          <button
            onClick={() => {setActiveTab("dashboard"); setEditingAddress(null); setShowAddForm(false);}}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all snap-start flex-shrink-0 ${
              activeTab === "dashboard" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {setActiveTab("details"); setEditingAddress(null); setShowAddForm(false);}}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all snap-start flex-shrink-0 ${
              activeTab === "details" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => {setActiveTab("orders"); setEditingAddress(null); setShowAddForm(false);}}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all snap-start flex-shrink-0 flex items-center gap-2 ${
              activeTab === "orders" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Orders
            {orders.length > 0 && <span className="bg-slate-200 text-slate-600 text-[10px] py-0.5 px-1.5 rounded-full">{orders.length}</span>}
          </button>
          <button
            onClick={() => {setActiveTab("addresses"); setEditingAddress(null); setShowAddForm(false);}}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all snap-start flex-shrink-0 ${
              activeTab === "addresses" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Addresses
          </button>
          <button
            onClick={() => {setActiveTab("wishlist"); setEditingAddress(null); setShowAddForm(false);}}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all snap-start flex-shrink-0 flex items-center gap-2 ${
              activeTab === "wishlist" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Wishlist
            {wishlist.length > 0 && <span className="bg-slate-200 text-slate-600 text-[10px] py-0.5 px-1.5 rounded-full">{wishlist.length}</span>}
          </button>
        </div>
      </div>

      <main className="p-4">
        
        {/* --- TAB: DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">Hello, {user.name || "User"}!</h2>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Manage your account activity, orders, and delivery addresses from here.
            </p>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Contact Info</h3>
                <p className="font-extrabold text-slate-800">{user.name || "Not provided"}</p>
                <p className="text-sm text-slate-600 mt-1">📞 {user.phone}</p>
                <p className="text-sm text-slate-600 mt-1">✉️ {user.email || "No email provided"}</p>
                <button onClick={() => setActiveTab('details')} className="mt-4 w-full py-2 bg-cyan-50 text-[#00b8d9] text-sm font-bold rounded-xl">Edit Details</button>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">SMS Updates</h3>
                <div className="flex justify-between items-center gap-4">
                  <p className="text-xs text-slate-500">Receive order notifications via SMS.</p>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={isSmsSubscribed} onChange={handleSmsToggle} disabled={isUpdatingSms} />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b8d9]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: DETAILS --- */}
        {activeTab === "details" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Edit Profile</h3>
            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                <input type="text" value={detailsForm.name} onChange={e => setDetailsForm({...detailsForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20" required />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input type="tel" value={detailsForm.phone} className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none cursor-not-allowed" readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <input type="email" value={detailsForm.email} onChange={e => setDetailsForm({...detailsForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20" />
              </div>
              <button type="submit" className="w-full mt-4 bg-[#00b8d9] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition-transform">
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* --- TAB: ORDERS --- */}
        {activeTab === "orders" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            {loadingData ? <p className="text-slate-500 text-center py-10">Loading orders...</p> : orders.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-400 font-bold mb-2">No orders found.</p>
                <Link href="/" className="text-[#00b8d9] font-bold text-sm hover:underline">Start Shopping</Link>
              </div>
            ) : (
              orders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-extrabold text-slate-800">{order.order_number}</p>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.styles}`}>{badge.text}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-3 truncate">
                      {order.first_item_name} {order.items_count > 1 ? `+${order.items_count - 1} items` : ''}
                    </p>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <p className="font-black text-slate-800 text-lg">₹{order.total_amount}</p>
                      <Link href={`/order/${order.order_number}`} className="bg-cyan-50 text-[#00b8d9] px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform">View Details</Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* --- TAB: ADDRESSES --- */}
        {activeTab === "addresses" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!showAddForm && !editingAddress && (
              <button onClick={() => {setShowAddForm(true); setPinVerified(null)}} className="w-full bg-[#00b8d9] text-white font-bold py-3.5 rounded-xl mb-6 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add New Address
              </button>
            )}
            
            {/* ADD / EDIT FORM FOR MOBILE */}
            {(showAddForm || editingAddress) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                <h3 className="font-black text-lg mb-4 text-slate-800">
                  {showAddForm ? "New Address" : "Edit Address"}
                </h3>
                
                <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Step 1: Set Map Location</p>
                    <button type="button" onClick={() => handleGetExactLocation(!showAddForm)} disabled={isLocating} className="w-full mb-3 py-2.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold text-xs bg-white text-[#00b8d9] border-[#00b8d9]/30">
                      {isLocating ? "⏳ Locating..." : "📍 Detect Live Location"}
                    </button>
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-40 mb-3 relative z-10">
                       <MapPicker latitude={(showAddForm ? newAddress : editingAddress).latitude} longitude={(showAddForm ? newAddress : editingAddress).longitude} onChange={(lat, lng) => verifyLocationPin(lat, lng, !showAddForm)} />
                    </div>
                    {locationError && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg border border-rose-200 text-xs font-bold mb-2">{locationError}</div>}
                    {pinVerified && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200 text-xs font-bold text-center">✅ Valid Location</div>}
                </div>

                <form onSubmit={showAddForm ? handleCreateAddress : handleUpdateAddress} className={`space-y-4 transition-opacity ${!pinVerified ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Step 2: Details</p>
                  <input type="text" placeholder="Recipient Name" value={(showAddForm ? newAddress : editingAddress).name} onChange={e => showAddForm ? setNewAddress({...newAddress, name: e.target.value}) : setEditingAddress({...editingAddress, name: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 text-sm font-semibold" required />
                  <input type="tel" placeholder="Phone Number" value={(showAddForm ? newAddress : editingAddress).phone} onChange={e => showAddForm ? setNewAddress({...newAddress, phone: e.target.value}) : setEditingAddress({...editingAddress, phone: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 text-sm font-semibold" required />
                  <input type="text" placeholder="House/Flat/Street Address" value={(showAddForm ? newAddress : editingAddress).address_line1} onChange={e => showAddForm ? setNewAddress({...newAddress, address_line1: e.target.value}) : setEditingAddress({...editingAddress, address_line1: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 text-sm font-semibold" required />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="City" value={(showAddForm ? newAddress : editingAddress).city} onChange={e => showAddForm ? setNewAddress({...newAddress, city: e.target.value}) : setEditingAddress({...editingAddress, city: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 text-sm font-semibold" required />
                    <input type="text" placeholder="State" value={(showAddForm ? newAddress : editingAddress).state} onChange={e => showAddForm ? setNewAddress({...newAddress, state: e.target.value}) : setEditingAddress({...editingAddress, state: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 text-sm font-semibold" required />
                  </div>
                  
                  <input type="text" value={(showAddForm ? newAddress : editingAddress).zipcode} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed" readOnly />

                  <div className="flex flex-col gap-3 pt-4">
                    <button type="submit" disabled={!pinVerified} className="w-full bg-[#00b8d9] text-white py-3.5 rounded-xl font-bold active:scale-95 transition-transform disabled:bg-slate-300">Save Address</button>
                    <button type="button" onClick={() => {setShowAddForm(false); setEditingAddress(null); setPinVerified(null)}} className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold pointer-events-auto opacity-100">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* ADDRESS CARDS */}
            {!showAddForm && !editingAddress && (
              <div className="space-y-4">
                {loadingData ? <p className="text-slate-500 text-center py-6">Loading addresses...</p> : addresses.length === 0 ? (
                  <div className="bg-white text-center py-10 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-bold text-sm">No saved addresses.</p>
                  </div>
                ) : addresses.map((addr) => (
                  <div key={addr.id} className="bg-white rounded-2xl p-5 border border-slate-200 relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => {setEditingAddress(addr); setPinVerified(true);}} className="text-[10px] font-black uppercase text-[#00b8d9] bg-cyan-50 px-2 py-1 rounded hover:bg-cyan-100">Edit</button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100">Delete</button>
                    </div>

                    <h4 className="font-extrabold text-slate-800 text-base mb-1 pr-20">{addr.name}</h4>
                    <p className="text-xs text-slate-500 mb-3 font-semibold">📞 {addr.phone}</p>
                    
                    <div className="space-y-1 mb-4">
                      <p className="text-slate-600 text-sm leading-snug">{addr.address_line1}</p>
                      <p className="text-slate-600 text-xs">{addr.city}, {addr.state}</p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <p className="text-slate-800 font-extrabold text-xs">PIN: {addr.zipcode}</p>
                      {addr.latitude && <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">📍 Saved</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: WISHLIST --- */}
        {activeTab === "wishlist" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {unavailableItemsCount > 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  You have {unavailableItemsCount} item(s) in your wishlist that are currently out of stock in your selected delivery area.
                </p>
              </div>
            )}

            {loadingWishlist ? (
              <p className="text-slate-500 text-center py-10">Loading wishlist...</p>
            ) : wishlist.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl text-center border border-slate-200 shadow-sm">
                <HeartCrack className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-lg font-black text-slate-800 mb-2">Your wishlist is empty</h2>
                <p className="text-slate-500 mb-6 font-medium text-xs">Looks like you haven't saved any items yet.</p>
                <Link href="/" className="px-6 py-3 bg-[#00b8d9] text-white font-bold rounded-xl active:scale-95 inline-block text-sm">
                  Discover Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {wishlist.map((product) => {
                  const isUnavailable = product.is_available === false;

                  return (
                    <div key={product.id} className={`bg-white rounded-2xl p-4 border relative ${isUnavailable ? 'opacity-60 border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
                      
                      {isUnavailable && (
                        <div className="absolute top-0 left-0 bg-rose-500 text-white px-2 py-1 rounded-br-lg z-10">
                          <span className="text-[8px] font-black uppercase tracking-wider">Unavailable</span>
                        </div>
                      )}

                      <button 
                        onClick={() => removeFromWishlist(product.id)}
                        className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform border border-slate-100"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>

                      <div className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center mb-3">
                        {product.image ? (
                          <img src={`http://localhost:8000${product.image}`} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>

                      <div>
                        <h3 className={`font-bold truncate mb-1 text-xs ${isUnavailable ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {product.name}
                        </h3>
                        <div className="flex items-baseline gap-1.5 mb-3">
                          <span className={`text-sm font-black ${isUnavailable ? 'text-slate-400' : 'text-[#00b8d9]'}`}>₹{product.price}</span>
                          {product.compare_price && <span className="text-[10px] text-slate-400 line-through font-medium">₹{product.compare_price}</span>}
                        </div>
                        
                        <button 
                          onClick={() => !isUnavailable && router.push(`/product/${product.slug}`)} 
                          disabled={isUnavailable}
                          className={`w-full py-2.5 font-bold rounded-lg transition-all text-xs ${isUnavailable ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-[#00b8d9] text-white hover:bg-[#00a0bd] active:scale-95'}`}
                        >
                          {isUnavailable ? "Unavailable" : "View Details"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}