"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Heart,
  HeartCrack,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MapPin,
  Loader2,
  X,
  LogOut,
  Package,
  User,
  Settings,
  Bell,
  Shield,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Navigation,
  CheckCircle2,
  MessageCircleQuestion,
  FileText,
  ShieldCheck,
  RotateCcw,
  Headphones,
} from "lucide-react";

const MapPicker = dynamic(() => import("../../../components/MapPicker"), {
  ssr: false,
});

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

type ActiveView =
  | "menu"
  | "dashboard"
  | "details"
  | "orders"
  | "addresses"
  | "wishlist";

export default function AccountMobile() {
  const router = useRouter();

  // --- NAVIGATION ---
  const [activeView, setActiveView] = useState<ActiveView>("menu");

  // --- CORE STATE ---
  const [user, setUser] = useState<any>(null);
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
  const [detailsForm, setDetailsForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // --- CONFIRM LOGOUT ---
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ================= FETCHING =================
  const fetchUserData = async (userId: number) => {
    setLoadingData(true);
    try {
      const [ordersRes, addrRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/orders/my-orders/${userId}`),
        fetch(`http://localhost:8000/api/v1/orders/my-addresses/${userId}`),
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
      const u = JSON.parse(storedUser);
      let fetchUrl = `http://localhost:8000/api/v1/wishlist/${u.id}`;
      if (storedZip && storedZip !== "undefined")
        fetchUrl += `?zipcode=${storedZip}`;
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((dbWishlist) => {
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
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setDetailsForm({
      name: parsedUser.name || "",
      email: parsedUser.email || "",
      phone: parsedUser.phone || "",
    });
    setIsSmsSubscribed(parsedUser.sms_subscription || false);
    setNewAddress((prev) => ({ ...prev, zipcode: sessionZipcode }));
    fetchUserData(parsedUser.id);
    fetchWishlistData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "zipcode") {
        setLoadingWishlist(true);
        fetchWishlistData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router, fetchWishlistData]);

  // Lock body scroll for address sheets / logout
  useEffect(() => {
    if (showAddForm || editingAddress || showLogoutConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddForm, editingAddress, showLogoutConfirm]);

  // ================= WISHLIST =================
  const removeFromWishlist = async (productId: number) => {
    const updated = wishlist.filter((item) => item.id !== productId);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    if (user) {
      try {
        await fetch("http://localhost:8000/api/v1/wishlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            product_ids: updated.map((item) => item.id),
          }),
        });
      } catch (error) {
        console.error("Wishlist sync failed", error);
      }
    }
  };

  // ================= SMS =================
  const handleSmsToggle = async () => {
    setIsUpdatingSms(true);
    const newStatus = !isSmsSubscribed;
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/otp/update-sms-subscription`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, status: newStatus }),
        }
      );
      if (res.ok) {
        setIsSmsSubscribed(newStatus);
        const updatedUser = { ...user, sms_subscription: newStatus };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("SMS Update Error:", error);
    } finally {
      setIsUpdatingSms(false);
    }
  };

  // ================= UPDATE DETAILS =================
  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(detailsForm),
        }
      );
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

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // ================= ADDRESS LOGIC =================
  // ================= ADDRESS LOGIC =================
  const verifyLocationPin = async (
    lat: number,
    lng: number,
    isEdit: boolean
  ) => {
    setIsLocating(true);
    setLocationError("");
    setPinVerified(null);
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      
      // ✅ FIX: Completely removed strict Zipcode blocking!
      // We now trust the Lat/Lng and let the backend handle the 15km radius limit during checkout.
      setPinVerified(true);
      setLocationError("");

      if (data && data.address) {
        if (!isEdit) {
          setNewAddress((prev) => ({
            ...prev,
            city: data.address.city || data.address.town || data.address.county || "",
            state: data.address.state || "Kerala",
            zipcode: data.address.postcode || sessionZip, // Auto-fill their real mapped zip
            latitude: lat,
            longitude: lng,
          }));
        } else {
          setEditingAddress((prev: any) => ({
            ...prev,
            city: data.address.city || data.address.town || data.address.county || prev.city,
            state: data.address.state || prev.state,
            zipcode: data.address.postcode || prev.zipcode,
            latitude: lat,
            longitude: lng,
          }));
        }
      } else {
        if (!isEdit)
          setNewAddress((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        else
          setEditingAddress((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
      }
    } catch {
      setPinVerified(true);
      if (!isEdit)
        setNewAddress((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      else
        setEditingAddress((prev: any) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
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
      (pos) =>
        verifyLocationPin(pos.coords.latitude, pos.coords.longitude, isEdit),
      () => {
        setIsLocating(false);
        setLocationError("Location access denied.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ✅ NEW: Search Map via Text
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
    
    setMapSearchQuery(displayName);
    setMapSearchResults([]);
    
    verifyLocationPin(numLat, numLng, isEdit);
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinVerified) return alert("Please set a valid map location.");
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/orders/addresses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newAddress, user_id: user.id }),
        }
      );
      if (res.ok) {
        setShowAddForm(false);
        setPinVerified(null);
        setNewAddress({
          name: "",
          phone: "",
          email: "",
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          zipcode: sessionZip,
          latitude: null,
          longitude: null,
        });
        fetchUserData(user.id);
      } else {
        const err = await res.json();
        alert("Failed: " + (err.detail || "Server error"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinVerified === false) return alert("Please fix map location.");
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/orders/addresses/${editingAddress.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingAddress),
        }
      );
      if (res.ok) {
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
    if (!window.confirm("Delete this address?")) return;
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/orders/addresses/${addressId}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchUserData(user.id);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status)
      return { text: "Unknown", styles: "bg-slate-100 text-slate-800" };
    switch (status.toLowerCase()) {
      case "pending":
        return {
          text: "Payment Pending",
          styles: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
      case "confirmed":
        return {
          text: "Confirmed",
          styles: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "delivered":
        return {
          text: "Delivered",
          styles: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };
      case "cancelled":
        return {
          text: "Canceled",
          styles: "bg-rose-50 text-rose-600 border-rose-100",
        };
      default:
        return {
          text: status.replace(/_/g, " ").toUpperCase(),
          styles: "bg-slate-100 text-slate-800 border-slate-200",
        };
    }
  };

  // ================= NAVIGATE TO SUB VIEW =================
  const goTo = (view: ActiveView) => {
    setActiveView(view);
    setEditingAddress(null);
    setShowAddForm(false);
    setPinVerified(null);
    setLocationError("");
    // Scroll to top when navigating to sub-view
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  };

  if (!user) return null;

  const unavailableItemsCount = wishlist.filter(
    (item) => item.is_available === false
  ).length;

  // ================= SUB VIEW HEADER =================
  // ================= SUB VIEW HEADER (Used for Orders, Wishlist, Details) =================
  const SubHeader = ({ title }: { title: string }) => (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center gap-3">
      <button
        onClick={() => goTo("menu")}
        className="text-slate-900 p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <h1 className="text-base font-extrabold text-slate-900">{title}</h1>
    </div>
  );

  // ================= ADDRESS FORM SHEET =================
  // ✅ FIX: Changed from a Component to a normal render function to prevent unmounting
  const renderAddressFormSheet = (isEdit: boolean, onClose: () => void) => {
    const currentAddress = isEdit ? editingAddress : newAddress;
    const setField = (field: string, value: any) => {
      if (isEdit) {
        setEditingAddress((prev: any) => ({ ...prev, [field]: value }));
      } else {
        setNewAddress((prev) => ({ ...prev, [field]: value }));
      }
    };

    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-slate-500 active:bg-slate-50 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-extrabold text-slate-900">
              {isEdit ? "Edit Address" : "New Address"}
            </h1>
          </div>

          <div className="px-4 py-6 pb-32">
            {/* Step 1 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 overflow-visible">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                Step 1 · Find on Map
              </p>

              {/* ✅ THE NEW SEARCH BAR */}
              <div className="mb-4 relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search area, street..."
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                    className="flex-1 border border-slate-200 p-3 rounded-xl outline-none bg-white focus:ring-2 focus:ring-[#00b8d9]/20 focus:border-[#00b8d9] transition-all text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={mapSearchLoading || !mapSearchQuery}
                    className="bg-slate-900 text-white px-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all text-sm flex items-center justify-center min-w-[80px]"
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
                        onClick={() => handleSelectSearchResult(res.lat, res.lon, res.display_name, isEdit)}
                        className="p-3 border-b border-slate-100 last:border-0 hover:bg-cyan-50 cursor-pointer text-[11px] leading-snug text-slate-700 font-medium transition-colors"
                      >
                        {res.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <button
                type="button"
                onClick={() => handleGetExactLocation(isEdit)}
                disabled={isLocating}
                className="w-full mb-3 py-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 font-bold text-[#00b8d9] active:scale-[0.98] transition-all"
              >
                {isLocating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Navigation size={18} />
                )}
                {isLocating ? "Detecting..." : "Detect Live Location"}
              </button>
              <div className="rounded-xl overflow-hidden border border-slate-200 h-48 mb-3 relative z-0">
                <MapPicker
                  latitude={currentAddress?.latitude}
                  longitude={currentAddress?.longitude}
                  onChange={(lat, lng) => verifyLocationPin(lat, lng, isEdit)}
                />
              </div>
              {locationError && (
                <div className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {locationError}
                </div>
              )}
              {pinVerified && (
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  GPS Verified for zone {sessionZip}
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div
              className={`transition-opacity duration-300 ${
                isEdit
                  ? pinVerified === false
                    ? "opacity-40 pointer-events-none"
                    : "opacity-100"
                  : !pinVerified
                  ? "opacity-40 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                Step 2 · Address Details
              </p>
              <form
                onSubmit={isEdit ? handleUpdateAddress : handleCreateAddress}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Recipient Name *"
                  value={currentAddress?.name || ""}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={currentAddress?.phone || ""}
                  onChange={(e) => setField("phone", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                  required
                />
                <input
                  type="text"
                  placeholder="House / Street Address *"
                  value={currentAddress?.address_line1 || ""}
                  onChange={(e) => setField("address_line1", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Apartment, suite (Optional)"
                  value={currentAddress?.address_line2 || ""}
                  onChange={(e) => setField("address_line2", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City *"
                    value={currentAddress?.city || ""}
                    onChange={(e) => setField("city", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={currentAddress?.state || ""}
                    onChange={(e) => setField("state", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={currentAddress?.zipcode || sessionZip}
                    className="w-full bg-slate-100 border border-transparent rounded-xl py-3.5 px-4 text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
                    readOnly
                  />
                  <span className="absolute -top-2 left-3 bg-slate-100 px-1.5 text-[8px] font-black text-slate-400 rounded uppercase tracking-wider">
                    Zone Locked
                  </span>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3 z-20">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEdit ? pinVerified === false : !pinVerified}
                    className="flex-1 py-3.5 bg-[#00b8d9] text-white font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isEdit ? "Update" : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ===================================================================
  //                          RENDER
  // ===================================================================
  return (
    <div className="md:hidden bg-slate-50 min-h-screen pb-28">
      {/* ========================================
          MAIN MENU VIEW
      ======================================== */}
      {activeView === "menu" && (
        <div className="animate-in fade-in duration-200">
          {/* Sticky Header */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-slate-900 p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="font-semibold text-sm">My Account</span>
            <div className="w-10"></div>
          </div>

          {/* Profile Card */}
          <div className="px-4 pt-5 pb-2">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-[#00b8d9] rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                {(user.name || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-800 text-base truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-slate-400 font-medium truncate">
                  {user.phone}
                </p>
                {user.email && (
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => goTo("details")}
                className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform border border-slate-100"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => goTo("orders")}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 text-center active:scale-95 transition-transform"
              >
                <Package
                  size={20}
                  className="mx-auto mb-1.5 text-[#00b8d9]"
                />
                <p className="text-lg font-black text-slate-800">
                  {orders.length}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Orders
                </p>
              </button>
              <button
                onClick={() => goTo("addresses")}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 text-center active:scale-95 transition-transform"
              >
                <MapPin
                  size={20}
                  className="mx-auto mb-1.5 text-emerald-500"
                />
                <p className="text-lg font-black text-slate-800">
                  {addresses.length}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Addresses
                </p>
              </button>
              <button
                onClick={() => goTo("wishlist")}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 text-center active:scale-95 transition-transform"
              >
                <Heart size={20} className="mx-auto mb-1.5 text-rose-400" />
                <p className="text-lg font-black text-slate-800">
                  {wishlist.length}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Wishlist
                </p>
              </button>
            </div>
          </div>

          {/* ======== MENU LIST ======== */}
          <div className="px-4 space-y-6 pb-4">
            {/* Section: Account */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                Account
              </p>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {[
                  {
                    label: "Order History",
                    icon: Package,
                    color: "text-[#00b8d9]",
                    action: () => goTo("orders"),
                    badge: orders.length > 0 ? orders.length : null,
                  },
                  {
                    label: "My Wishlist",
                    icon: Heart,
                    color: "text-rose-400",
                    action: () => goTo("wishlist"),
                    badge: wishlist.length > 0 ? wishlist.length : null,
                  },
                  {
                    label: "Address Book",
                    icon: MapPin,
                    color: "text-emerald-500",
                    action: () => goTo("addresses"),
                    badge: null,
                  },
                  {
                    label: "Account Settings",
                    icon: Settings,
                    color: "text-slate-500",
                    action: () => goTo("details"),
                    badge: null,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className={item.color} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 flex-1 text-left">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* Section: SMS Toggle */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                Preferences
              </p>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">
                      SMS Updates
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Order updates via SMS
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isSmsSubscribed}
                      onChange={handleSmsToggle}
                      disabled={isUpdatingSms}
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b8d9]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Section: Information (redirects to pages) */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                Information
              </p>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {[
                  {
                    label: "Contact Us",
                    icon: Headphones,
                    color: "text-blue-500",
                    href: "/contact",
                  },
                  {
                    label: "FAQ",
                    icon: MessageCircleQuestion,
                    color: "text-violet-500",
                    href: "/faq",
                  },
                  {
                    label: "Terms & Conditions",
                    icon: FileText,
                    color: "text-slate-500",
                    href: "/terms",
                  },
                  {
                    label: "Privacy Policy",
                    icon: ShieldCheck,
                    color: "text-emerald-500",
                    href: "/privacy-policy",
                  },
                  {
                    label: "Refund Policy",
                    icon: RotateCcw,
                    color: "text-orange-500",
                    href: "/refund-policy",
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className={item.color} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 flex-1 text-left">
                      {item.label}
                    </span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full bg-white rounded-2xl p-4 border border-rose-100 flex items-center gap-3 active:bg-rose-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                  <LogOut size={18} className="text-rose-500" />
                </div>
                <span className="text-sm font-bold text-rose-500 flex-1 text-left">
                  Sign Out
                </span>
              </button>
            </div>

            {/* Version */}
            <p className="text-center text-[10px] text-slate-300 font-bold pb-4">
              Fresh & Safe · v1.0
            </p>
          </div>
        </div>
      )}

      {/* ========================================
          SUB VIEW: ORDERS
      ======================================== */}
      {activeView === "orders" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
          <SubHeader title="Order History" />
          <div className="px-4 py-5">
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2
                  size={24}
                  className="animate-spin text-[#00b8d9]"
                />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center mt-4">
                <Package
                  size={40}
                  className="mx-auto mb-3 text-slate-200"
                />
                <p className="text-base font-bold text-slate-800 mb-1">
                  No orders yet
                </p>
                <p className="text-xs text-slate-400 mb-5 font-medium">
                  Start shopping to see your orders here.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 bg-[#00b8d9] text-white font-bold text-sm rounded-xl active:scale-95 transition-transform"
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <Link
                      key={order.id}
                      href={`/order/${order.order_number}`}
                      className="bg-white rounded-2xl p-4 border border-slate-100 block active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-extrabold text-slate-800">
                          {order.order_number}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${badge.styles}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                      {order.first_item_name && (
                        <p className="text-xs text-slate-500 font-medium mb-1 truncate">
                          {order.first_item_name}
                          {order.items_count > 1 && (
                            <span className="text-slate-400">
                              {" "}
                              +{order.items_count - 1} more
                            </span>
                          )}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <p className="text-[11px] text-slate-400 font-medium">
                          {order.date}
                        </p>
                        <p className="text-sm font-extrabold text-slate-800">
                          ₹{order.total_amount}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          SUB VIEW: ADDRESSES
      ======================================== */}
      {activeView === "addresses" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => goTo("menu")}
                className="text-slate-900 p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h1 className="text-base font-extrabold text-slate-900">
                Address Book
              </h1>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setPinVerified(null);
                setLocationError("");
                setMapSearchQuery(""); // ✅ Clear Search
                setMapSearchResults([]); // ✅ Clear Results
              }}
              className="w-10 h-10 bg-[#00b8d9] rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="px-4 py-5">
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2
                  size={24}
                  className="animate-spin text-[#00b8d9]"
                />
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-200 text-center mt-4">
                <MapPin
                  size={40}
                  className="mx-auto mb-3 text-slate-200"
                />
                <p className="text-base font-bold text-slate-800 mb-1">
                  No saved addresses
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Add an address to speed up checkout.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={18} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-extrabold text-slate-800 truncate">
                            {addr.name}
                          </h4>
                          {addr.latitude && (
                            <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex-shrink-0">
                              GPS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">
                          {addr.address_line1}
                        </p>
                        <p className="text-xs text-slate-400">
                          {addr.city}, {addr.state} - {addr.zipcode}
                        </p>
                        {addr.phone && (
                          <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                            <Phone size={10} /> {addr.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setEditingAddress(addr);
                          setPinVerified(true);
                          setLocationError("");
                          setMapSearchQuery(""); // ✅ Clear Search
                          setMapSearchResults([]); // ✅ Clear Results
                        }}
                        className="flex-1 py-2.5 bg-slate-50 text-[#00b8d9] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform border border-slate-100"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="py-2.5 px-4 bg-slate-50 text-rose-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform border border-slate-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          SUB VIEW: WISHLIST
      ======================================== */}
      {activeView === "wishlist" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
          <SubHeader title="My Wishlist" />
          <div className="px-4 py-5">
            {unavailableItemsCount > 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-[11px] font-bold">
                  {unavailableItemsCount} item(s) unavailable in your area.
                </p>
              </div>
            )}

            {loadingWishlist ? (
              <div className="flex items-center justify-center py-20">
                <Loader2
                  size={24}
                  className="animate-spin text-[#00b8d9]"
                />
              </div>
            ) : wishlist.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center mt-4">
                <HeartCrack
                  size={40}
                  className="mx-auto mb-3 text-slate-200"
                />
                <p className="text-base font-bold text-slate-800 mb-1">
                  Wishlist is empty
                </p>
                <p className="text-xs text-slate-400 mb-5 font-medium">
                  Save items you love for later.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 bg-[#00b8d9] text-white font-bold text-sm rounded-xl active:scale-95 transition-transform"
                >
                  Discover Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlist.map((product) => {
                  const isUnavailable = product.is_available === false;
                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-2xl border p-3 flex gap-3 relative transition-all ${
                        isUnavailable
                          ? "opacity-60 border-rose-200 bg-rose-50/30"
                          : "border-slate-100"
                      }`}
                    >
                      {isUnavailable && (
                        <div className="absolute top-0 left-0 bg-rose-500 text-white px-2 py-0.5 rounded-br-lg rounded-tl-2xl z-10">
                          <span className="text-[8px] font-black uppercase tracking-wider">
                            Unavailable
                          </span>
                        </div>
                      )}
                      <Link
                        href={
                          isUnavailable ? "#" : `/product/${product.slug}`
                        }
                        className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100"
                      >
                        {product.image ? (
                          <img
                            src={`http://localhost:8000${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200 text-2xl">
                            📦
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3
                            className={`text-sm font-bold truncate mb-0.5 ${
                              isUnavailable
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {product.name}
                          </h3>
                          <div className="flex items-baseline gap-2">
                            <span
                              className={`text-base font-black ${
                                isUnavailable
                                  ? "text-slate-400"
                                  : "text-[#00b8d9]"
                              }`}
                            >
                              ₹{product.price}
                            </span>
                            {product.compare_price && (
                              <span className="text-[11px] text-slate-400 line-through font-medium">
                                ₹{product.compare_price}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isUnavailable && (
                          <Link
                            href={`/product/${product.slug}`}
                            className="text-[11px] font-bold text-[#00b8d9] active:opacity-70 mt-1"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="self-start p-2 active:scale-90 transition-transform flex-shrink-0"
                      >
                        <Heart className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          SUB VIEW: ACCOUNT SETTINGS / DETAILS
      ======================================== */}
      {activeView === "details" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
          <SubHeader title="Account Settings" />
          <div className="px-4 py-5 space-y-4">
            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={detailsForm.name}
                    onChange={(e) =>
                      setDetailsForm({
                        ...detailsForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={detailsForm.phone}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-400 outline-none cursor-not-allowed"
                      readOnly
                    />
                    <Shield
                      size={14}
                      className="absolute right-4 top-4 text-slate-300"
                    />
                  </div>
                  <p className="text-[10px] mt-1 text-slate-400 font-bold ml-1">
                    Phone number cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={detailsForm.email}
                    onChange={(e) =>
                      setDetailsForm({
                        ...detailsForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all"
                  />
                </div>
              </div>

              {/* SMS Toggle inside settings */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                    <Bell size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      SMS Updates
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Receive order updates via SMS
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isSmsSubscribed}
                    onChange={handleSmsToggle}
                    disabled={isUpdatingSms}
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b8d9]"></div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#00b8d9] text-white font-bold rounded-xl active:scale-[0.98] transition-all"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADDRESS FORM SHEETS ================= */}
      {showAddForm && renderAddressFormSheet(false, () => {
          setShowAddForm(false);
          setPinVerified(null);
          setLocationError("");
        })
      }
      {editingAddress && renderAddressFormSheet(true, () => {
          setEditingAddress(null);
          setPinVerified(null);
          setLocationError("");
        })
      }

      {/* ================= LOGOUT CONFIRMATION ================= */}
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[2rem] p-6 animate-in slide-in-from-bottom-5 duration-300">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute -top-14 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                <LogOut size={28} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-1">
                Sign Out?
              </h3>
              <p className="text-slate-400 text-xs mb-6 text-center max-w-[240px]">
                Are you sure you want to sign out of your account?
              </p>
              <div className="w-full flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3.5 bg-rose-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}