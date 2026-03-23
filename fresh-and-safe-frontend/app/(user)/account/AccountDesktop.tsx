  "use client";

  import React, { useEffect, useState, useCallback } from "react";
  import { useRouter } from "next/navigation";
  import Link from "next/link";
  import dynamic from "next/dynamic";
  import { Heart, HeartCrack, Trash2, AlertCircle, Loader2 } from "lucide-react";

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

  export default function AccountPage() {
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
    const [mapSearchQuery, setMapSearchQuery] = useState("");
    const [mapSearchLoading, setMapSearchLoading] = useState(false);
    const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
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
      // 1. Clear the stored data
      localStorage.clear(); 
      
      // 2. Force a hard redirect to the home page (triggers a full page reload)
      window.location.href = "/";
    };

   
    // ================= ADDRESS LOGIC =================
  const verifyLocationPin = async (lat: number, lng: number, isEdit: boolean) => {
      setIsLocating(true);
      setLocationError("");
      setPinVerified(null);

      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          
          // ✅ FIX: Completely removed strict Zipcode blocking. 
          // We now trust the Lat/Lng and let the backend handle the 15km radius limit!
          setPinVerified(true);
          setLocationError("");

          if (data && data.address) {
              if (!isEdit) {
                  setNewAddress(prev => ({
                      ...prev,
                      city: data.address.city || data.address.town || data.address.county || "",
                      state: data.address.state || "Kerala",
                      zipcode: data.address.postcode || sessionZip, // Auto-fill real mapped zip
                      latitude: lat,
                      longitude: lng
                  }));
              } else {
                  setEditingAddress((prev: any) => ({ 
                      ...prev, 
                      zipcode: data.address.postcode || prev.zipcode,
                      latitude: lat, 
                      longitude: lng 
                  }));
              }
          } else {
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
        setLocationError("GPS is not supported by your device.");
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => verifyLocationPin(position.coords.latitude, position.coords.longitude, isEdit),
        (error) => { setIsLocating(false); setLocationError("Location access denied."); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // ✅ NEW: Search Map via Text
    // ✅ NEW: Search Map via Text
    const handleSearchLocation = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!mapSearchQuery.trim()) return;

      setMapSearchLoading(true);
      setLocationError("");
      try {
        // ✅ FIX: Match the Admin API exactly! Append ", Kerala" and use countrycodes=in
        const enhancedQuery = encodeURIComponent(`${mapSearchQuery.trim()}, Kerala`);
        const url = `https://nominatim.openstreetmap.org/search?q=${enhancedQuery}&countrycodes=in&format=json&addressdetails=1&limit=5`;
        
        const res = await fetch(url, {
          headers: { "Accept-Language": "en-US,en" }
        });
        
        const data = await res.json();
        if (data && data.length > 0) {
          setMapSearchResults(data);
        } else {
          setMapSearchResults([]);
          setLocationError("Location not found. Try a different search term or use the map pin.");
        }
      } catch (err) {
        console.error("Search failed", err);
        setLocationError("Network error while searching map.");
      } finally {
        setMapSearchLoading(false);
      }
    };

    // ✅ NEW: Select a search result and update the map
    const handleSelectSearchResult = (lat: string, lon: string, displayName: string, isEdit: boolean) => {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lon);
      
      // Fill the input with the selected name and hide the dropdown
      setMapSearchQuery(displayName);
      setMapSearchResults([]);
      
      // Reuse your existing verification function to update the map pin!
      verifyLocationPin(numLat, numLng, isEdit);
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
      <div className="bg-slate-50 min-h-screen text-slate-900 antialiased font-sans">
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex gap-8">
          
          {/* ================= SIDEBAR NAVIGATION ================= */}
          <aside className="w-[260px] shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-4">
                My Account
              </h4>
              <nav className="flex flex-col gap-1 mb-8">
                <button
                  onClick={() => {setActiveTab("dashboard"); setEditingAddress(null); setShowAddForm(false);}}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
                    activeTab === "dashboard" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
                  Account Dashboard
                </button>
                <button
                  onClick={() => {setActiveTab("details"); setEditingAddress(null); setShowAddForm(false);}}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
                    activeTab === "details" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  Account Details
                </button>
                <button
                  onClick={() => {setActiveTab("addresses"); setEditingAddress(null); setShowAddForm(false);}}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
                    activeTab === "addresses" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  Address Book
                </button>
                <button
                  onClick={() => {setActiveTab("wishlist"); setEditingAddress(null); setShowAddForm(false);}}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${
                    activeTab === "wishlist" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5" />
                    My Wishlist
                  </div>
                  {wishlist.length > 0 && <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">{wishlist.length}</span>}
                </button>
              </nav>

              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-4">
                My Orders
              </h4>
              <nav className="flex flex-col gap-1 mb-8">
                <button
                  onClick={() => {setActiveTab("orders"); setEditingAddress(null); setShowAddForm(false);}}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${
                    activeTab === "orders" ? "text-[#00b8d9] bg-cyan-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 5c.17.678-.369 1.353-1.054 1.353H5.435c-.685 0-1.225-.675-1.054-1.353l1.263-5a.995.995 0 0 1 .966-.757h10.778a.995.995 0 0 1 .966.757Z" /></svg>
                    Order History
                  </div>
                  {orders.length > 0 && <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">{orders.length}</span>}
                </button>
              </nav>

              <div className="h-px bg-slate-200 w-full mb-6" />

              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
                Logout
              </button>
            </div>
          </aside>

          {/* ================= MAIN CONTENT AREA ================= */}
          <section className="flex-1 min-w-0">
            
            {/* --- TAB: DASHBOARD --- */}
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">My Dashboard</h1>
                <p className="text-slate-500 text-sm mb-8">
                  Hello, <span className="font-bold text-[#00b8d9]">{user.name || "User"}!</span> From your dashboard you can view a snapshot of your recent account activity and update your account information.
                </p>

                <div className="bg-white rounded-2xl p-8 border border-slate-200 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#00b8d9] hover:underline">View All</button>
                  </div>
                  
                  {loadingData ? <p className="text-slate-400 text-sm">Loading orders...</p> : orders.length === 0 ? <p className="text-slate-400 text-sm">No recent orders found.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="pb-3 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Order #</th>
                            <th className="pb-3 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Date</th>
                            <th className="pb-3 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Total</th>
                            <th className="pb-3 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Status</th>
                            <th className="pb-3 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 3).map((order) => {
                            const badge = getStatusBadge(order.status);
                            return (
                              <tr key={order.id} className="border-b border-slate-100 last:border-0">
                                <td className="py-4 font-bold text-slate-700">{order.order_number}</td>
                                <td className="py-4 text-slate-500">{order.date}</td>
                                <td className="py-4 font-bold text-slate-700">₹{order.total_amount}</td>
                                <td className="py-4">
                                  <span className={`px-3 py-1 rounded-md text-xs font-bold border ${badge.styles}`}>{badge.text}</span>
                                </td>
                                <td className="py-4 text-right">
                                  <Link href={`/order/${order.order_number}`} className="text-[#00b8d9] text-xs font-bold hover:underline">View Order</Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-8 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Account Information</h3>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Information</h4>
                        <button onClick={() => setActiveTab('details')} className="text-xs font-bold text-[#00b8d9] hover:underline">Edit</button>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-800 mb-1">{user.name || "Not provided"}</p>
                        <p className="text-sm text-slate-500 mb-1">{user.phone}</p>
                        <p className="text-sm text-slate-500">{user.email || "No email provided"}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">SMS Updates</h4>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 h-[106px] flex justify-between items-center">
                        <p className="text-sm text-slate-500 max-w-[150px]">Receive order updates via SMS.</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={isSmsSubscribed} onChange={handleSmsToggle} disabled={isUpdatingSms} />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b8d9]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: DETAILS --- */}
            {activeTab === "details" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Account Details</h1>
                <p className="text-slate-500 text-sm mb-8">Update your personal information and contact details.</p>

                <div className="bg-white rounded-2xl p-8 border border-slate-200">
                  <form onSubmit={handleUpdateDetails}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                        <input type="text" value={detailsForm.name} onChange={e => setDetailsForm({...detailsForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 transition-all" required />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                        <input type="tel" value={detailsForm.phone} className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none cursor-not-allowed" readOnly />
                        <p className="text-[10px] mt-1 text-slate-400 font-bold">Phone number cannot be changed.</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                        <input type="email" value={detailsForm.email} onChange={e => setDetailsForm({...detailsForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 transition-all" />
                      </div>
                    </div>
                    <button type="submit" className="bg-[#00b8d9] hover:bg-[#00a0bd] text-white font-bold py-3 px-8 rounded-xl transition-all">
                      Save Changes
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* --- TAB: ORDERS --- */}
            {activeTab === "orders" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Order History</h1>
                <p className="text-slate-500 text-sm mb-8">View and track all your past and current orders.</p>

                <div className="bg-white rounded-2xl p-8 border border-slate-200">
                  {loadingData ? <p className="text-slate-500">Loading orders...</p> : orders.length === 0 ? <p className="text-slate-500">No orders found.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="pb-3 pr-4 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Order ID</th>
                            <th className="pb-3 px-4 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Date</th>
                            <th className="pb-3 px-4 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Items</th>
                            <th className="pb-3 px-4 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Total</th>
                            <th className="pb-3 px-4 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Status</th>
                            <th className="pb-3 pl-4 text-[10px] uppercase text-slate-400 tracking-widest font-extrabold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => {
                            const badge = getStatusBadge(order.status);
                            return (
                              <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-5 pr-4 font-bold text-slate-700">{order.order_number}</td>
                                <td className="py-5 px-4 text-slate-500">{order.date}</td>
                                <td className="py-5 px-4 text-slate-600">
                                  {order.first_item_name ? (
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-800 line-clamp-1">{order.first_item_name}</span>
                                      {order.items_count > 1 && <span className="text-[10px] font-bold text-slate-400">+{order.items_count - 1} more</span>}
                                    </div>
                                  ) : <span>{order.items_count} Items</span>}
                                </td>
                                <td className="py-5 px-4 font-bold text-slate-700">₹{order.total_amount}</td>
                                <td className="py-5 px-4">
                                  <span className={`px-3 py-1 rounded-md text-xs font-bold border ${badge.styles}`}>{badge.text}</span>
                                </td>
                                <td className="py-5 pl-4 text-right">
                                  <Link href={`/order/${order.order_number}`} className="px-4 py-2 bg-slate-50 text-[#00b8d9] font-bold text-xs rounded-xl border border-slate-200 hover:border-[#00b8d9] hover:bg-cyan-50 transition">Details</Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: ADDRESSES --- */}
            {activeTab === "addresses" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b pb-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Address Book</h1>
                    <p className="text-slate-500 text-sm">Manage your saved delivery addresses.</p>
                  </div>
                  {!showAddForm && !editingAddress && (
                    <button 
                      onClick={() => {
                        setShowAddForm(true); 
                        setPinVerified(null);
                        setMapSearchQuery(""); // ✅ Clears the search input
                        setMapSearchResults([]); // ✅ Clears any leftover dropdown results
                        setLocationError(""); // ✅ Clears any leftover errors
                      }} 
                      className="bg-[#00b8d9] hover:bg-[#00a0bd] text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Add New Address
                    </button>
                  )}
                </div>
                
                {/* ✅ FORM: ADD NEW ADDRESS */}
                {showAddForm && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-10 shadow-sm animate-in slide-in-from-top duration-300">
                    <h3 className="font-black text-xl mb-6 text-slate-800 flex items-center gap-3">
                      <span className="w-8 h-8 bg-cyan-50 text-[#00b8d9] rounded-lg flex items-center justify-center text-lg">+</span>
                      New Delivery Address
                    </h3>
                    
                    <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl overflow-visible">
                        <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Step 1: Find on Map</p>
                        
                        {/* ✅ THE NEW SEARCH BAR */}
                        <div className="mb-4 relative">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Search area, street, or landmark..."
                              value={mapSearchQuery}
                              onChange={(e) => setMapSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                              className="flex-1 border border-slate-200 p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold"
                            />
                            <button
                              type="button"
                              onClick={handleSearchLocation}
                              disabled={mapSearchLoading || !mapSearchQuery}
                              className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all text-sm flex items-center justify-center min-w-[100px]"
                            >
                              {mapSearchLoading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                            </button>
                          </div>

                          {/* Search Results Dropdown */}
                          {mapSearchResults.length > 0 && (
                            <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {mapSearchResults.map((res: any, idx: number) => (
                                <li
                                  key={idx}
                                  onClick={() => handleSelectSearchResult(res.lat, res.lon, res.display_name, false)}
                                  className="p-3 border-b border-slate-100 last:border-0 hover:bg-cyan-50 cursor-pointer text-xs text-slate-700 font-medium transition-colors"
                                >
                                  {res.display_name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-4 gap-4">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <button type="button" onClick={() => handleGetExactLocation(false)} disabled={isLocating} className="w-full mb-4 py-3.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold transition-all bg-white text-[#00b8d9] border-[#00b8d9]/30 hover:bg-cyan-50 active:scale-[0.98]">
                          {isLocating ? "⏳ Locating Your Exact Spot..." : "📍 Detect My Live Location"}
                        </button>

                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-64 mb-4">
                          <MapPicker latitude={newAddress.latitude} longitude={newAddress.longitude} onChange={(lat, lng) => verifyLocationPin(lat, lng, false)} />
                        </div>

                        {locationError && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 text-sm font-bold">{locationError}</div>}
                        {pinVerified && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-bold text-center">✅ Location Verified in Zone {sessionZip}</div>}
                    </div>

                    <form onSubmit={handleCreateAddress} className={`space-y-5 transition-opacity ${!pinVerified ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Step 2: Enter Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Recipient Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                        <input type="text" placeholder="Phone Number" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                      </div>
                      <input type="text" placeholder="House/Flat/Street Address" value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                        <input type="text" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                        <div className="relative">
                          <input type="text" value={newAddress.zipcode} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed" readOnly />
                          <span className="absolute -top-2 left-3 bg-slate-100 px-1 text-[9px] font-black text-slate-400 rounded">ZONE LOCKED</span>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button type="submit" disabled={!pinVerified} className="bg-[#00b8d9] text-white py-3.5 px-8 rounded-xl font-bold hover:bg-[#00a0bd] transition-all disabled:bg-slate-300">Save Address</button>
                        <button type="button" onClick={() => {setShowAddForm(false); setPinVerified(null)}} className="py-3.5 px-8 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all pointer-events-auto opacity-100">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ✅ FORM: EDIT ADDRESS */}
                {editingAddress && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-10 shadow-sm animate-in slide-in-from-top duration-300">
                    <h3 className="font-black text-xl mb-6 text-slate-800">Edit Address</h3>
                    
                    <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl overflow-visible">
                        <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Step 1: Verify Map Location</p>
                        
                        {/* ✅ THE NEW SEARCH BAR (EDIT MODE) */}
                        <div className="mb-4 relative">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Search area, street, or landmark..."
                              value={mapSearchQuery}
                              onChange={(e) => setMapSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                              className="flex-1 border border-slate-200 p-3.5 rounded-xl outline-none bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold"
                            />
                            <button
                              type="button"
                              onClick={handleSearchLocation}
                              disabled={mapSearchLoading || !mapSearchQuery}
                              className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all text-sm flex items-center justify-center min-w-[100px]"
                            >
                              {mapSearchLoading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                            </button>
                          </div>

                          {/* Search Results Dropdown */}
                          {mapSearchResults.length > 0 && (
                            <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {mapSearchResults.map((res: any, idx: number) => (
                                <li
                                  key={idx}
                                  onClick={() => handleSelectSearchResult(res.lat, res.lon, res.display_name, true)} // Note: isEdit is TRUE here
                                  className="p-3 border-b border-slate-100 last:border-0 hover:bg-cyan-50 cursor-pointer text-xs text-slate-700 font-medium transition-colors"
                                >
                                  {res.display_name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-4 gap-4">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <button type="button" onClick={() => handleGetExactLocation(true)} disabled={isLocating} className="w-full mb-4 py-3.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold transition-all bg-white text-[#00b8d9] border-[#00b8d9]/30 hover:bg-cyan-50 active:scale-[0.98]">
                          {isLocating ? "⏳ Updating GPS..." : "📍 Re-Detect Live Location"}
                        </button>

                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-64 mb-4">
                          <MapPicker latitude={editingAddress.latitude} longitude={editingAddress.longitude} onChange={(lat, lng) => verifyLocationPin(lat, lng, true)} />
                        </div>

                        {locationError && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 text-sm font-bold">{locationError}</div>}
                        {pinVerified === true && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-bold text-center">✅ Location Verified</div>}
                    </div>

                    <form onSubmit={handleUpdateAddress} className={`space-y-5 transition-opacity ${pinVerified === false ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Step 2: Update Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Name" value={editingAddress.name} onChange={e => setEditingAddress({...editingAddress, name: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                        <input type="text" placeholder="Phone" value={editingAddress.phone} onChange={e => setEditingAddress({...editingAddress, phone: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                      </div>
                      <input type="text" placeholder="Address" value={editingAddress.address_line1} onChange={e => setEditingAddress({...editingAddress, address_line1: e.target.value})} className="border border-slate-200 w-full p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="City" value={editingAddress.city} onChange={e => setEditingAddress({...editingAddress, city: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                        <input type="text" placeholder="State" value={editingAddress.state} onChange={e => setEditingAddress({...editingAddress, state: e.target.value})} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold" required />
                        <input type="text" value={editingAddress.zipcode} className="border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed" readOnly />
                      </div>

                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button type="submit" disabled={pinVerified === false} className="bg-[#00b8d9] text-white py-3.5 px-8 rounded-xl font-bold hover:bg-[#00a0bd] transition-all disabled:bg-slate-300">Update Address</button>
                        <button type="button" onClick={() => {setEditingAddress(null); setPinVerified(null)}} className="py-3.5 px-8 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all pointer-events-auto opacity-100">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ✅ ADDRESS LIST DISPLAY */}
                {!showAddForm && !editingAddress && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {loadingData ? <p className="text-slate-500 col-span-2">Loading addresses...</p> : addresses.length === 0 ? (
                      <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-400 font-bold">No addresses saved. Click "Add New Address" to get started.</p>
                      </div>
                    ) : addresses.map((addr) => (
                      <div key={addr.id} className="bg-white rounded-2xl p-6 border border-slate-200 relative group hover:border-[#00b8d9] transition-colors shadow-sm">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingAddress(addr); 
                              setPinVerified(true);
                              setMapSearchQuery(""); // ✅ Clears the search input
                              setMapSearchResults([]); // ✅ Clears any leftover dropdown results
                              setLocationError(""); // ✅ Clears any leftover errors
                            }} 
                            className="text-[10px] font-black uppercase text-[#00b8d9] bg-cyan-50 px-3 py-1 rounded-md hover:bg-cyan-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1 rounded-md hover:bg-rose-100 transition-colors">Delete</button>
                        </div>

                        <h4 className="font-extrabold text-slate-800 text-lg mb-1">{addr.name}</h4>
                        <p className="text-sm text-slate-500 mb-4 font-semibold flex items-center gap-1">📞 {addr.phone}</p>
                        
                        <div className="space-y-1 mb-6">
                          <p className="text-slate-600 text-sm leading-relaxed">{addr.address_line1}</p>
                          <p className="text-slate-600 text-sm">{addr.city}, {addr.state}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <p className="text-slate-800 font-extrabold text-xs tracking-wide">PIN: {addr.zipcode}</p>
                          {addr.latitude && <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">📍 GPS Saved</span>}
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
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">My Wishlist</h1>
                    <p className="text-slate-500 text-sm">View and manage your saved items.</p>
                  </div>
                  <span className="bg-cyan-50 text-[#00b8d9] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-cyan-100">
                    {wishlist.length} Items
                  </span>
                </div>

                {unavailableItemsCount > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-8 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <p className="text-sm font-bold">
                      You have {unavailableItemsCount} item(s) in your wishlist that are currently out of stock in your selected delivery area.
                    </p>
                  </div>
                )}

                {loadingWishlist ? (
                  <p className="text-slate-500 text-center py-10">Loading wishlist...</p>
                ) : wishlist.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 max-w-xl mx-auto mt-6 shadow-sm">
                    <HeartCrack className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-slate-800 mb-2">Your wishlist is empty</h2>
                    <p className="text-slate-500 mb-6 font-medium text-sm">Looks like you haven't saved any items you love yet.</p>
                    <Link href="/" className="px-6 py-3 bg-[#00b8d9] hover:bg-[#00a0bd] text-white font-bold rounded-xl shadow-lg shadow-cyan-100 transition-all active:scale-95 inline-block">
                      Discover Products
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => {
                      const isUnavailable = product.is_available === false;

                      return (
                        <div key={product.id} className={`bg-white rounded-2xl p-5 border transition-all duration-300 group relative ${isUnavailable ? 'opacity-60 border-rose-200 bg-rose-50/30' : 'border-slate-200 hover:border-[#00b8d9]'}`}>
                          
                          {isUnavailable && (
                            <div className="absolute top-0 left-0 bg-rose-500 text-white px-3 py-1 rounded-br-xl shadow-sm flex items-center z-10">
                              <span className="text-[9px] font-black uppercase tracking-wider">Unavailable Here</span>
                            </div>
                          )}

                          <button 
                            onClick={() => removeFromWishlist(product.id)}
                            className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                          >
                            <Heart className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                          </button>

                          <div className="overflow-hidden rounded-xl bg-slate-50 mb-4 relative aspect-square flex items-center justify-center">
                            {product.image ? (
                              <img 
                                src={`http://localhost:8000${product.image}`} 
                                alt={product.name} 
                                className={`w-full h-full object-cover ${!isUnavailable ? 'transition-transform duration-500 group-hover:scale-105' : ''}`} 
                              />
                            ) : (
                              <span className="text-4xl text-slate-300">📦</span>
                            )}
                            </div>

                          <div>
                            <h3 className={`font-bold truncate mb-1 text-sm ${isUnavailable ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {product.name}
                            </h3>
                            <div className="flex items-baseline gap-2 mb-4">
                              <span className={`text-lg font-black ${isUnavailable ? 'text-slate-400' : 'text-[#00b8d9]'}`}>₹{product.price}</span>
                              {product.compare_price && <span className="text-xs text-slate-400 line-through font-medium">₹{product.compare_price}</span>}
                            </div>
                            
                            <button 
                              onClick={() => !isUnavailable && router.push(`/product/${product.slug}`)} 
                              disabled={isUnavailable}
                              className={`w-full py-2.5 font-bold rounded-xl transition-all shadow-md text-sm ${isUnavailable ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none' : 'bg-[#00b8d9] text-white hover:bg-[#00a0bd] active:scale-95'}`}
                            >
                              {isUnavailable ? "Currently Unavailable" : "View Details"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </section>
        </main>
      </div>
    );
  }