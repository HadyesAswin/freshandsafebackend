'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, X, Scale, AlertCircle, ShoppingBag } from 'lucide-react';

const MapPicker = dynamic(() => import("../../../components/MapPicker"), { ssr: false });

export interface Address {
  id?: number;
  name: string;
  type: string;
  text: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string;
  is_available?: boolean;
}

// ✅ Deduplicate cart items — warn in dev, merge as safety net
const deduplicateCart = (items: CartItem[]): CartItem[] => {
  const map = new Map<number, CartItem>();
  let hasDuplicates = false;
  items.forEach(item => {
    if (map.has(item.id)) {
      hasDuplicates = true;
      const existing = map.get(item.id)!;
      map.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      map.set(item.id, { ...item });
    }
  });
  if (hasDuplicates) {
    console.warn("⚠️ DUPLICATE CART ITEMS FROM BACKEND!", items.map(i => `id:${i.id} qty:${i.quantity}`));
  }
  return Array.from(map.values());
};

const CartMobile: React.FC = () => {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sessionZip, setSessionZip] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address1: "", address2: "", city: "", state: "", zipcode: "",
    latitude: null as number | null, longitude: null as number | null,
  });

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  const [showWeightLimitPopup, setShowWeightLimitPopup] = useState(false);

  const topAddressRef = useRef<HTMLDivElement>(null);

  const calculateTotalWeight = (qty: number, unitStr: string | undefined) => {
    if (!unitStr) return "";
    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/);
    const unitValue = match ? parseFloat(match[0]) : 1;
    if (unit.includes("g") && !unit.includes("k")) {
      const totalG = qty * unitValue;
      return totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
    }
    if (unit.includes("kg")) return `${(qty * unitValue).toFixed(1)}kg`;
    if (unit.includes("pc") || unit.includes("piece")) return `${qty * unitValue} Pcs`;
    return `${qty * unitValue} ${unitStr}`;
  };

  // ✅ NEW: Helper to calculate mathematical weight in KG
  const getWeightInKg = (unitStr: string | undefined, qty: number) => {
    if (!unitStr) return 0.5 * qty; // Default to 500g if no unit is set
    
    const unit = unitStr.toLowerCase();
    const match = unit.match(/(\d+(\.\d+)?)/);
    const unitValue = match ? parseFloat(match[0]) : 1;

    if (unit.includes("kg")) return unitValue * qty;
    if (unit.includes("g") && !unit.includes("k")) return (unitValue / 1000) * qty;
    
    // For "pc", "packet", "piece" -> Assume 500g (0.5kg)
    return 0.5 * qty; 
  };

  // ✅ NEW: Calculate the total weight of the ENTIRE cart
  const getCurrentCartWeight = (currentCart: CartItem[]) => {
    return currentCart.reduce((total, item) => total + getWeightInKg(item.unit, item.quantity), 0);
  };

  const handleSelectSavedAddress = useCallback((addr: any) => {
    setUseNewAddress(false);
    setSelectedAddress({
      id: addr.id, name: addr.name, type: "Saved",
      text: `${addr.address_line1}, ${addr.city}`,
      phone: addr.phone, email: addr.email,
      address_line1: addr.address_line1, address_line2: addr.address_line2,
      city: addr.city, state: addr.state, zipcode: addr.zipcode,
      latitude: addr.latitude, longitude: addr.longitude,
    });
    setAddressModalOpen(false);
  }, []);

  const handleAddNewClick = () => {
    setUseNewAddress(true);
    setPinVerified(null);
    setLocationError("");
    setMapSearchQuery(""); // ✅ Clear Search
    setMapSearchResults([]); // ✅ Clear Results
    setFormData(prev => ({
      ...prev, firstName: user?.name || "", lastName: "",
      phone: user?.phone || "", email: user?.email || "",
      address1: "", address2: "", city: "", state: "",
      latitude: null, longitude: null,
    }));
  };

  const fetchCartData = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    const storedZip = localStorage.getItem("zipcode") || "";
    const storedCart = localStorage.getItem("cart");
    const localCart = storedCart ? JSON.parse(storedCart) : [];

    setSessionZip(storedZip);
    setFormData(prev => ({ ...prev, zipcode: storedZip }));
    localStorage.removeItem("selected_delivery_address");
    localStorage.removeItem("calculated_delivery_fee");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      fetch(`http://localhost:8000/api/v1/orders/my-addresses/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
            setFormData(prev => ({ ...prev, firstName: parsedUser.name || "", phone: parsedUser.phone || "", email: parsedUser.email || "" }));
          }
        })
        .catch(err => console.error("Error fetching addresses:", err));

      let fetchUrl = `http://localhost:8000/api/v1/cart/${parsedUser.id}`;
      if (storedZip && storedZip !== "undefined") fetchUrl += `?zipcode=${storedZip}`;

      fetch(fetchUrl)
        .then(res => res.json())
        .then(dbCart => {
          const validCart = Array.isArray(dbCart) ? dbCart : [];
          if (validCart.length === 0 && localCart.length > 0) {
            updateCartStorage(localCart, parsedUser);
          } else {
            const dedupedCart = deduplicateCart(validCart);
            setCart(dedupedCart);
            localStorage.setItem("cart", JSON.stringify(dedupedCart));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setUseNewAddress(true);
      if (localCart.length > 0) {
        fetch(`http://localhost:8000/api/v1/cart/guest`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipcode: storedZip, items: localCart }),
        })
          .then(res => res.json())
          .then(validatedCart => {
            const validCart = Array.isArray(validatedCart) ? validatedCart : [];
            const dedupedCart = deduplicateCart(validCart);
            setCart(dedupedCart);
            localStorage.setItem("cart", JSON.stringify(dedupedCart));
            setLoading(false);
          })
          .catch(() => { setCart(deduplicateCart(localCart)); setLoading(false); });
      } else {
        setCart([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCartData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "zipcode") {
        setSelectedAddress(null);
        setDeliveryFee(null);
        setLoading(true);
        fetchCartData();
      }
    };
    const handleAuthChange = () => {
      setSelectedAddress(null);
      setDeliveryFee(null);
      setDiscount(0);
      setCouponCode("");
      setCouponError("");
      setLoading(true);
      fetchCartData();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-login", handleAuthChange);
    window.addEventListener("user-logout", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-login", handleAuthChange);
      window.removeEventListener("user-logout", handleAuthChange);
    };
  }, [fetchCartData]);

  const updateCartStorage = async (updatedCart: CartItem[], specificUser?: any) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    const activeUser = specificUser || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null);
    if (activeUser) {
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: activeUser.id, items: updatedCart.map(i => ({ product_id: i.id, quantity: i.quantity })) }),
        });
      } catch (error) { console.error("Sync failed:", error); }
    }
  };

  const handleCartModification = () => {
    if (discount > 0) { setDiscount(0); setCouponError("Cart modified. Apply coupon again."); }
  };

  const increaseQuantity = (id: number) => {
    const itemToIncrease = cart.find((i) => i.id === id);
    if (!itemToIncrease) return;

    // 1. Calculate how much weight ONE MORE of this item adds
    const additionalWeight = getWeightInKg(itemToIncrease.unit, 1);
    
    // 2. Get current total cart weight
    const currentTotalWeight = getCurrentCartWeight(cart);

    // 3. Check if adding this pushes us over 5kg
    if (currentTotalWeight + additionalWeight > 5.0) {
      setShowWeightLimitPopup(true);
      return; // 🛑 Block the increase!
    }

    // 4. Safe to increase
    updateCartStorage(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
    handleCartModification();
  };
  const decreaseQuantity = (id: number) => {
    updateCartStorage(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item));
    handleCartModification();
  };
  const removeItem = (id: number) => {
    updateCartStorage(cart.filter(item => item.id !== id));
    handleCartModification();
  };

  const availableItems = cart.filter(item => item.is_available !== false);
  const unavailableItemsCount = cart.length - availableItems.length;
  const subtotal = availableItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalTotal = subtotal + (deliveryFee || 0) - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const verifyLocationPin = async (lat: number, lng: number) => {
    setIsLocating(true); setLocationError(""); setPinVerified(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data?.address?.postcode) {
        const mappedZip = data.address.postcode;
        if (mappedZip !== sessionZip) {
          if (mappedZip.substring(0, 4) === sessionZip.substring(0, 4)) { setPinVerified(true); }
          else { setPinVerified(false); setLocationError(`Pin (${mappedZip}) is too far from store area (${sessionZip}).`); return; }
        } else { setPinVerified(true); }
        setFormData(prev => ({ ...prev, city: data.address.city || data.address.town || data.address.county || prev.city, state: data.address.state || prev.state, latitude: lat, longitude: lng }));
      } else { setPinVerified(true); setFormData(prev => ({ ...prev, latitude: lat, longitude: lng })); }
    } catch { setPinVerified(true); setFormData(prev => ({ ...prev, latitude: lat, longitude: lng })); }
    finally { setIsLocating(false); }
  };

  const handleGetExactLocation = () => {
    setIsLocating(true); setLocationError("");
    if (!navigator.geolocation) { setLocationError("GPS not supported."); setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => verifyLocationPin(pos.coords.latitude, pos.coords.longitude),
      () => { setIsLocating(false); setLocationError("Location access denied."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ✅ NEW: Search Map via Text
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setMapSearchLoading(true);
    setLocationError("");
    try {
      const enhancedQuery = encodeURIComponent(`${mapSearchQuery.trim()}, Kerala`);
      const url = `https://nominatim.openstreetmap.org/search?q=${enhancedQuery}&countrycodes=in&format=json&addressdetails=1&limit=5`;
      
      const res = await fetch(url, { headers: { "Accept-Language": "en-US,en" } });
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
  const handleSelectSearchResult = (lat: string, lon: string, displayName: string) => {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lon);
    
    setMapSearchQuery(displayName);
    setMapSearchResults([]);
    
    verifyLocationPin(numLat, numLng);
  };

  const saveNewAddressAndUse = () => {
    setSelectedAddress({
      name: `${formData.firstName} ${formData.lastName}`.trim(), type: "New",
      text: `${formData.address1}, ${formData.city}`, phone: formData.phone, email: formData.email,
      address_line1: formData.address1, address_line2: formData.address2,
      city: formData.city, state: formData.state, zipcode: formData.zipcode,
      latitude: formData.latitude, longitude: formData.longitude,
    });
    setAddressModalOpen(false);
  };

  useEffect(() => {
    if (!selectedAddress || availableItems.length === 0) { setDeliveryFee(null); return; }
    
    // ✅ DELETED the subtotal > 500 block so it ALWAYS calculates a fee!

    const calculateFee = async () => {
      setIsCalculatingFee(true);
      let totalWeightInKg = 0;
      availableItems.forEach(item => {
        if (item.unit) {
          const unit = item.unit.toLowerCase();
          const match = unit.match(/(\d+(\.\d+)?)/);
          const unitValue = match ? parseFloat(match[0]) : 1;
          if (unit.includes("kg")) totalWeightInKg += unitValue * item.quantity;
          else if (unit.includes("g") && !unit.includes("k")) totalWeightInKg += (unitValue / 1000) * item.quantity;
          else totalWeightInKg += 0.5 * item.quantity;
        } else { totalWeightInKg += 0.5 * item.quantity; }
      });
      if (totalWeightInKg < 1.0) totalWeightInKg = 1.0;
      try {
        const outletId = parseInt(localStorage.getItem("outlet_id") || localStorage.getItem("selectedOutlet") || "2", 10);
        const res = await fetch("http://localhost:8000/api/v1/orders/calculate-delivery-fee", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outlet_id: outletId, delivery_latitude: selectedAddress.latitude || null, delivery_longitude: selectedAddress.longitude || null, delivery_zipcode: selectedAddress.zipcode || localStorage.getItem("zipcode"), weight: parseFloat(totalWeightInKg.toFixed(2)) }),
        });
       if (res.ok) { 
          const data = await res.json(); 
          setDeliveryFee(data.delivery_fee); 
        } else { 
          // ✅ Catch the backend 15km error, drop the address, and alert the user
          const errData = await res.json();
          setDeliveryFee(null); 
          setSelectedAddress(null);
          alert(errData.detail || "Location is outside our 15km delivery zone.");
        }
      } catch { 
        setDeliveryFee(null); 
        setSelectedAddress(null);
      } finally { setIsCalculatingFee(false); }
    };
    calculateFee();
  }, [selectedAddress, availableItems.length, subtotal]);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!user) { setCouponError("Login required for coupons."); return; }
    if (!couponCode.trim()) { setCouponError("Enter coupon code"); return; }
    try {
      const res = await fetch("http://localhost:8000/api/v1/public-coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal, user_id: user.id, items: availableItems.map(item => ({ product_id: item.id, quantity: item.quantity })) }),
      });
      if (!res.ok) { setCouponError("Server rejected the request."); return; }
      const data = await res.json();
      if (data.valid) { setDiscount(data.discount); } else { setDiscount(0); setCouponError(data.message); }
    } catch { setCouponError("Error validating coupon"); }
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      topAddressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    if (unavailableItemsCount > 0) { alert("Remove unavailable items to proceed."); return; }
    setIsBillModalOpen(true);
  };

  const handleCheckoutClick = () => {
    // ✅ NEW: Final Gatekeeper Check!
    const totalCartWeight = getCurrentCartWeight(cart);
    if (totalCartWeight > 5.0) {
      setShowWeightLimitPopup(true);
      return;
    }

    if (deliveryFee === null) { alert("Delivery fee is calculating. Please wait."); return; }
    localStorage.setItem("checkout_discount", JSON.stringify({ code: couponCode, amount: discount }));
    localStorage.setItem("selected_delivery_address", JSON.stringify(selectedAddress));
    localStorage.setItem("calculated_delivery_fee", JSON.stringify(deliveryFee));
    router.push("/checkout");
  };

  const isNewAddressValid = formData.firstName && formData.phone && formData.address1 && formData.city && formData.state && formData.zipcode && pinVerified === true;

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#00b8d9]" />
          <span className="text-xs font-bold uppercase tracking-widest">Refreshing Cart...</span>
        </div>
      </div>
    );
  }

  // --- Empty ---
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-slate-900 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></Link>
          <span className="font-semibold text-sm">Your Cart</span>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Looks like you haven't added any items yet.</p>
            <Link href="/" className="bg-[#00b8d9] text-white px-6 py-3 rounded-xl font-bold text-sm inline-block active:scale-95 transition-transform">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Cart ---
  return (
    <div className="min-h-screen bg-slate-50 pb-44 font-sans">

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-slate-900 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></Link>
        <span className="font-semibold text-sm">Your Cart <span className="text-slate-400 font-medium">({cart.length})</span></span>
        <div className="w-10"></div>
      </div>

      {/* Toast — positioned above checkout bar + bottom nav */}
      <div className={`fixed bottom-40 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 ease-out ${showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2.5">
          <div className="bg-rose-500 rounded-full p-1 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="12" y1="19" x2="12.01" y2="19"/></svg>
          </div>
          <span className="text-xs font-medium text-white whitespace-nowrap">Please select a delivery address</span>
        </div>
      </div>

      {/* Unavailable Warning */}
      {unavailableItemsCount > 0 && (
        <div className="mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold leading-relaxed">{unavailableItemsCount} item(s) can't be delivered here. Remove to checkout.</p>
        </div>
      )}

      {/* Address Section */}
      <div className="px-4 mt-4" ref={topAddressRef}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivering to</h3>
          {selectedAddress && <button onClick={() => setAddressModalOpen(true)} className="text-[10px] font-bold text-[#00b8d9] uppercase">Change</button>}
        </div>
        {!selectedAddress ? (
          <button onClick={() => setAddressModalOpen(true)} className="w-full py-3 px-4 border-2 border-dashed border-[#00b8d9] text-[#00b8d9] bg-[#00b8d9]/5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
            <span className="text-lg">+</span> Select or Add Address
          </button>
        ) : (
          <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 cursor-pointer" onClick={() => setAddressModalOpen(true)}>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100">
              <MapPin size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">{selectedAddress.name}</h4>
                <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{selectedAddress.type}</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{selectedAddress.text}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#00b8d9] flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="px-4 mt-5 space-y-3">
        {cart.map((item, index) => {
          const totalWeight = calculateTotalWeight(item.quantity, item.unit);
          const isUnavailable = item.is_available === false;
          return (
            <div key={`${item.id}-${index}`} className={`bg-white p-3.5 rounded-2xl border relative ${isUnavailable ? 'opacity-60 border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
              {isUnavailable && (
                <div className="absolute top-0 left-0 bg-rose-500 text-white px-2.5 py-1 rounded-br-xl rounded-tl-2xl z-10">
                  <span className="text-[8px] font-bold uppercase tracking-wider">Unavailable</span>
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1 min-w-0 pt-1">
                  {item.unit && !isUnavailable && (
                    <div className="flex items-center gap-1 mb-1">
                      <Scale className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{totalWeight}</span>
                    </div>
                  )}
                  {isUnavailable ? (
                    <h3 className="text-sm font-bold text-slate-400 line-through leading-snug line-clamp-2">{item.name}</h3>
                  ) : (
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{item.name}</h3>
                    </Link>
                  )}
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {item.unit ? `₹${item.price.toFixed(2)} / ${item.unit}` : `₹${item.price.toFixed(2)}`}
                  </p>
                </div>
                <Link href={isUnavailable ? '#' : `/product/${item.slug}`} className="w-20 h-20 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 mt-1">
                  {item.image ? (
                    <img src={`http://localhost:8000${item.image}`} className="w-full h-full object-cover" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300 font-bold uppercase">No Img</div>
                  )}
                </Link>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                <button onClick={() => removeItem(item.id)} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 opacity-80">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  Remove
                </button>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${isUnavailable && 'opacity-50 pointer-events-none'}`}>
                    <button onClick={() => decreaseQuantity(item.id)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 font-bold text-base bg-white active:scale-95">-</button>
                    <span className="text-sm font-extrabold text-slate-900 w-5 text-center">{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)} className="w-7 h-7 rounded-lg border border-[#00b8d9] bg-[#00b8d9]/5 flex items-center justify-center text-[#00b8d9] font-bold text-base active:scale-95">+</button>
                  </div>
                  <span className={`text-sm font-extrabold min-w-[60px] text-right ${isUnavailable ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Bottom Checkout Bar — sits ABOVE the MobileNavbar */}
      <div className="fixed bottom-16 left-0 right-0 z-[45] p-3">
        <button
          onClick={handleContinue}
          disabled={unavailableItemsCount > 0 || availableItems.length === 0}
          className={`w-full p-3.5 rounded-xl flex items-center justify-between active:scale-[0.98] transition-all ${
            selectedAddress && unavailableItemsCount === 0 && availableItems.length > 0
              ? 'bg-[#00b8d9] text-white' : 'bg-slate-300 text-white/80'
          }`}
        >
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">{availableItems.length} Items</span>
            <span className="text-lg font-extrabold leading-none">₹{finalTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-sm bg-black/10 px-4 py-1.5 rounded-lg">
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </div>
        </button>
      </div>

      {/* ═══════════ ADDRESS BOTTOM SHEET ═══════════ */}
      <div className={`fixed inset-0 z-[100] flex items-end transition-all duration-300 ${addressModalOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${addressModalOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setAddressModalOpen(false)} />
        <div className={`bg-white w-full rounded-t-3xl relative transition-transform duration-300 max-h-[90vh] overflow-y-auto ${addressModalOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <button onClick={() => setAddressModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-full p-2 z-10">
            <X size={18} strokeWidth={2.5} />
          </button>
          <div className="p-5 pb-8">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5"></div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-5">Delivery Address</h3>

            {/* Saved Addresses */}
            {user && savedAddresses.length > 0 && !useNewAddress && (
              <div className="space-y-3 mb-4">
                {savedAddresses.map(addr => {
                  const isOutOfZone = addr.zipcode && sessionZip && String(addr.zipcode).substring(0, 3) !== String(sessionZip).substring(0, 3);
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <div key={addr.id} onClick={() => { if (!isOutOfZone) handleSelectSavedAddress(addr); }}
                      className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                        isOutOfZone ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50' :
                        isSelected ? 'border-[#00b8d9] bg-cyan-50' : 'border-slate-100 bg-white'
                      }`}>
                      {isSelected && <div className="absolute top-0 right-0 bg-[#00b8d9] text-white px-2 py-0.5 rounded-bl-lg text-[9px] font-bold">Selected</div>}
                      <span className="font-bold text-slate-800 text-sm">{addr.name}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{addr.address_line1}, {addr.city}</p>
                      {addr.phone && <p className="text-[10px] text-slate-400 font-bold mt-1">📞 {addr.phone}</p>}
                      {isOutOfZone && <span className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 block tracking-widest">Out of delivery zone</span>}
                    </div>
                  );
                })}
                <button onClick={handleAddNewClick} className="w-full py-3 border-2 border-dashed border-[#00b8d9] text-[#00b8d9] rounded-xl font-bold text-sm">+ Add New Address</button>
              </div>
            )}

            {/* New Address Form */}
            {(!user || useNewAddress || (user && savedAddresses.length === 0)) && (
              <div className="space-y-5">
                {user && savedAddresses.length > 0 && (
                  <button onClick={() => setUseNewAddress(false)} className="text-xs font-bold text-[#00b8d9]">← Back to saved addresses</button>
                )}

                {/* Map Step */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-visible">
                  <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Step 1: Find on Map</p>
                  
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
                            onClick={() => handleSelectSearchResult(res.lat, res.lon, res.display_name)}
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

                  <button type="button" onClick={handleGetExactLocation} disabled={isLocating} className="w-full mb-3 py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-[#00b8d9] active:scale-[0.98]">
                    {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} Detect Live Location
                  </button>
                  <div className="rounded-xl overflow-hidden border border-slate-200 h-44 mb-3 relative z-0">
                    <MapPicker 
                      latitude={formData.latitude} 
                      longitude={formData.longitude} 
                      // ✅ Fetch dynamic shop coordinates for the visual circle
                      shopLat={parseFloat(localStorage.getItem("outlet_lat") || "0")} 
                      shopLng={parseFloat(localStorage.getItem("outlet_lng") || "0")}
                      onChange={(lat, lng) => verifyLocationPin(lat, lng)} 
                    />
                  </div>
                  {locationError && <div className="text-[10px] font-bold text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{locationError}</div>}
                  {pinVerified && (
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                      GPS Verified for zone {sessionZip}
                    </div>
                  )}
                </div>

                {/* Details Step */}
                <div className={`space-y-3 transition-opacity duration-300 ${!pinVerified ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Step 2: Address Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                    <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="tel" name="phone" placeholder="Phone *" value={formData.phone} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                  </div>
                  <input type="text" name="address1" placeholder="House & street name *" value={formData.address1} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                  <input type="text" name="address2" placeholder="Apartment, landmark (Optional)" value={formData.address2} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" name="city" placeholder="City *" value={formData.city} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                    <input type="text" name="state" placeholder="State *" value={formData.state} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold outline-none focus:border-[#00b8d9] placeholder:text-slate-400" />
                    <input type="text" name="zipcode" value={formData.zipcode} className="w-full bg-slate-100 border border-transparent rounded-xl py-3 px-3 text-sm font-bold text-slate-400 outline-none cursor-not-allowed" readOnly />
                  </div>
                  <button onClick={saveNewAddressAndUse} disabled={!isNewAddressValid} className="w-full mt-4 py-3.5 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] text-sm">
                    Save & Use Address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ BILL DETAILS BOTTOM SHEET ═══════════ */}
      <div className={`fixed inset-0 z-[100] flex items-end transition-all duration-300 ${isBillModalOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isBillModalOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsBillModalOpen(false)} />
        <div className={`bg-white w-full rounded-t-3xl p-5 pb-8 relative transition-transform duration-300 ${isBillModalOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <button onClick={() => setIsBillModalOpen(false)} className="absolute -top-12 left-1/2 -translate-x-1/2 w-9 h-9 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90">
            <X size={18} />
          </button>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5"></div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-5">Bill Details</h3>

          {/* Coupon */}
          <div className="flex gap-2 mb-1">
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon Code" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#00b8d9] font-semibold" disabled={unavailableItemsCount > 0} />
            <button onClick={handleApplyCoupon} disabled={unavailableItemsCount > 0} className="font-bold text-sm text-[#00b8d9] px-3 rounded-xl disabled:opacity-50">Apply</button>
          </div>
          {couponError && <p className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${couponError.includes("modified") ? "text-yellow-600" : "text-rose-500"}`}>{couponError}</p>}

          {/* Breakdown */}
          <div className="space-y-2.5 border-t border-slate-100 pt-4 mt-3 mb-5">
            <div className="flex justify-between text-sm text-slate-500 font-medium"><span>Subtotal</span><span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm font-medium text-emerald-500"><span>Discount</span><span className="font-bold">- ₹{discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Delivery</span>
              {isCalculatingFee ? <span className="text-slate-400 font-bold italic text-xs">Calculating...</span>
                : deliveryFee === 0 ? <span className="text-emerald-500 font-bold">Free</span>
                : deliveryFee === null ? <span className="text-slate-400 font-bold text-xs italic">—</span>
                : <span className="text-slate-800 font-bold">₹{deliveryFee.toFixed(2)}</span>}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-600 font-bold text-sm">Grand Total</span>
            <span className="text-xl font-extrabold text-slate-900">₹{finalTotal.toFixed(2)}</span>
          </div>

          {/* Checkout */}
          <button onClick={handleCheckoutClick} 
            // ✅ Added deliveryFee === null lock so users can't bypass 15km error
            disabled={isCalculatingFee || unavailableItemsCount > 0 || getCurrentCartWeight(cart) > 5.0 || deliveryFee === null}
            className={`w-full font-bold text-base py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
              !isCalculatingFee && unavailableItemsCount === 0 && getCurrentCartWeight(cart) <= 5.0 && deliveryFee !== null
                ? 'bg-[#00b8d9] text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            Checkout Securely
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      </div>

      {/* ✅ NEW: BEAUTIFUL WEIGHT LIMIT BOTTOM SHEET (MOBILE) */}
      <div className={`fixed inset-0 z-[150] flex items-end transition-all duration-300 ${showWeightLimitPopup ? 'visible' : 'invisible pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showWeightLimitPopup ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowWeightLimitPopup(false)} />
        <div className={`bg-white w-full rounded-t-3xl p-6 pb-8 relative transition-transform duration-300 text-center shadow-2xl ${showWeightLimitPopup ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
          
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-50">
            <Scale className="w-6 h-6 text-rose-500" />
          </div>
          
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Weight Limit Reached</h3>
          <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
            Delivery riders have a maximum capacity of <span className="font-bold text-slate-800">5kg</span> per order.
          </p>
          
          <div className="bg-cyan-50 border border-cyan-100 p-4 rounded-2xl mb-6">
            <p className="text-xs text-cyan-800 font-semibold mb-1">For bulk ordering, please contact our outlet:</p>
            <a href="tel:+919999999999" className="text-xl font-black text-[#00b8d9]">+91 99999 99999</a>
          </div>
          
          <button
            onClick={() => setShowWeightLimitPopup(false)}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartMobile;