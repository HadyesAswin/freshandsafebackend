'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Scale, AlertCircle, ShoppingBag, Loader2, MapPin, X } from 'lucide-react';

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

const CartDesktop: React.FC = () => {
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

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipcode: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
    if (unit.includes("pc") || unit.includes("piece")) return `${qty * unitValue} Pieces`;
    return `${qty * unitValue} ${unitStr}`;
  };

  // ✅ Address selection — state only, NO localStorage write here
  const handleSelectSavedAddress = useCallback((addr: any) => {
    setUseNewAddress(false);
    setSelectedAddress({
      id: addr.id,
      name: addr.name,
      type: "Saved",
      text: `${addr.address_line1}, ${addr.city}`,
      phone: addr.phone,
      email: addr.email,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      zipcode: addr.zipcode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
    setAddressModalOpen(false);
  }, []);

  const handleAddNewClick = () => {
    setUseNewAddress(true);
    setPinVerified(null);
    setLocationError("");
    setFormData((prev) => ({
      ...prev,
      firstName: user?.name || "",
      lastName: "",
      phone: user?.phone || "",
      email: user?.email || "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      latitude: null,
      longitude: null,
    }));
  };

  // ✅ Fetch cart & addresses — NEVER auto-select or restore address
  const fetchCartData = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    const storedZip = localStorage.getItem("zipcode") || "";
    const storedCart = localStorage.getItem("cart");
    const localCart = storedCart ? JSON.parse(storedCart) : [];

    setSessionZip(storedZip);
    setFormData((prev) => ({ ...prev, zipcode: storedZip }));

    // ✅ Clear any stale address from previous checkout attempts
    localStorage.removeItem("selected_delivery_address");
    localStorage.removeItem("calculated_delivery_fee");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Fetch Saved Addresses (for modal use only — no auto-select)
      fetch(`http://localhost:8000/api/v1/orders/my-addresses/${parsedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            // ✅ Do NOT auto-select any address. User must click.
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
            setFormData((prev) => ({
              ...prev,
              firstName: parsedUser.name || "",
              phone: parsedUser.phone || "",
              email: parsedUser.email || "",
            }));
          }
        })
        .catch((err) => console.error("Error fetching addresses:", err));

      // Fetch Cart
      let fetchUrl = `http://localhost:8000/api/v1/cart/${parsedUser.id}`;
      if (storedZip && storedZip !== "undefined") fetchUrl += `?zipcode=${storedZip}`;

      fetch(fetchUrl)
        .then((res) => res.json())
        .then((dbCart) => {
          const validCart = Array.isArray(dbCart) ? dbCart : [];
          if (validCart.length === 0 && localCart.length > 0) {
            updateCartStorage(localCart, parsedUser);
          } else {
            setCart(validCart);
            localStorage.setItem("cart", JSON.stringify(validCart));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Guest user — also no auto-select
      setUseNewAddress(true);

      if (localCart.length > 0) {
        fetch(`http://localhost:8000/api/v1/cart/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipcode: storedZip, items: localCart }),
        })
          .then((res) => res.json())
          .then((validatedCart) => {
            const validCart = Array.isArray(validatedCart) ? validatedCart : [];
            setCart(validCart);
            localStorage.setItem("cart", JSON.stringify(validCart));
            setLoading(false);
          })
          .catch(() => {
            setCart(localCart);
            setLoading(false);
          });
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

    // ✅ Listen for login/logout from Navbar on the SAME tab
    const handleAuthChange = () => {
      // Reset everything and re-fetch with new user context
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
    const activeUser =
      specificUser ||
      (localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!)
        : null);
    if (activeUser) {
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: activeUser.id,
            items: updatedCart.map((i) => ({
              product_id: i.id,
              quantity: i.quantity,
            })),
          }),
        });
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }
  };

  const handleCartModification = () => {
    if (discount > 0) {
      setDiscount(0);
      setCouponError("Cart modified. Please Apply coupon again.");
    }
  };

  const increaseQuantity = (id: number) => {
    updateCartStorage(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
    handleCartModification();
  };
  const decreaseQuantity = (id: number) => {
    updateCartStorage(
      cart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
    handleCartModification();
  };
  const removeItem = (id: number) => {
    updateCartStorage(cart.filter((item) => item.id !== id));
    handleCartModification();
  };

  const availableItems = cart.filter((item) => item.is_available !== false);
  const unavailableItemsCount = cart.length - availableItems.length;
  const subtotal = availableItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const finalTotal = subtotal + (deliveryFee || 0) - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const verifyLocationPin = async (lat: number, lng: number) => {
    setIsLocating(true);
    setLocationError("");
    setPinVerified(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data && data.address && data.address.postcode) {
        const mappedZip = data.address.postcode;
        if (mappedZip !== sessionZip) {
          if (mappedZip.substring(0, 4) === sessionZip.substring(0, 4)) {
            setPinVerified(true);
          } else {
            setPinVerified(false);
            setLocationError(
              `Pin (${mappedZip}) is too far from your selected store area (${sessionZip}).`
            );
            return;
          }
        } else {
          setPinVerified(true);
        }
        setFormData((prev) => ({
          ...prev,
          city:
            data.address.city ||
            data.address.town ||
            data.address.county ||
            prev.city,
          state: data.address.state || prev.state,
          latitude: lat,
          longitude: lng,
        }));
      } else {
        setPinVerified(true);
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      }
    } catch (err) {
      setPinVerified(true);
      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    } finally {
      setIsLocating(false);
    }
  };

  const handleGetExactLocation = () => {
    setIsLocating(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("GPS is not supported by your device/browser.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        verifyLocationPin(position.coords.latitude, position.coords.longitude),
      () => {
        setIsLocating(false);
        setLocationError("Location access denied.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ✅ Save new address — state only, localStorage written only at checkout
  const saveNewAddressAndUse = () => {
    setSelectedAddress({
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      type: "New",
      text: `${formData.address1}, ${formData.city}`,
      phone: formData.phone,
      email: formData.email,
      address_line1: formData.address1,
      address_line2: formData.address2,
      city: formData.city,
      state: formData.state,
      zipcode: formData.zipcode,
      latitude: formData.latitude,
      longitude: formData.longitude,
    });
    setAddressModalOpen(false);
  };

  // Delivery Fee Calculation
  useEffect(() => {
    if (!selectedAddress || availableItems.length === 0) {
      setDeliveryFee(null);
      return;
    }
    if (subtotal > 500) {
      setDeliveryFee(0);
      return;
    }
    const calculateFee = async () => {
      setIsCalculatingFee(true);
      let totalWeightInKg = 0;
      availableItems.forEach((item) => {
        if (item.unit) {
          const unit = item.unit.toLowerCase();
          const match = unit.match(/(\d+(\.\d+)?)/);
          const unitValue = match ? parseFloat(match[0]) : 1;
          if (unit.includes("kg"))
            totalWeightInKg += unitValue * item.quantity;
          else if (unit.includes("g") && !unit.includes("k"))
            totalWeightInKg += (unitValue / 1000) * item.quantity;
          else totalWeightInKg += 0.5 * item.quantity;
        } else {
          totalWeightInKg += 0.5 * item.quantity;
        }
      });
      if (totalWeightInKg < 1.0) totalWeightInKg = 1.0;
      try {
        const outletId = parseInt(
          localStorage.getItem("outlet_id") ||
            localStorage.getItem("selectedOutlet") ||
            "2",
          10
        );
        const res = await fetch(
          "http://localhost:8000/api/v1/orders/calculate-delivery-fee",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              outlet_id: outletId,
              delivery_latitude: selectedAddress.latitude || null,
              delivery_longitude: selectedAddress.longitude || null,
              delivery_zipcode:
                selectedAddress.zipcode || localStorage.getItem("zipcode"),
              weight: parseFloat(totalWeightInKg.toFixed(2)),
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setDeliveryFee(data.delivery_fee);
        } else {
          setDeliveryFee(null);
        }
      } catch (error) {
        setDeliveryFee(null);
      } finally {
        setIsCalculatingFee(false);
      }
    };
    calculateFee();
  }, [selectedAddress, availableItems.length, subtotal]);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!user) {
      setCouponError("Coupons are only available to logged-in users.");
      return;
    }
    if (!couponCode.trim()) {
      setCouponError("Enter coupon code");
      return;
    }
    try {
      const res = await fetch(
        "http://localhost:8000/api/v1/public-coupons/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: couponCode,
            subtotal: subtotal,
            user_id: user.id,
            items: availableItems.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );
      if (!res.ok) {
        setCouponError("Server rejected the request.");
        return;
      }
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
      } else {
        setDiscount(0);
        setCouponError(data.message);
      }
    } catch (error) {
      setCouponError("Error validating coupon");
    }
  };

  // ✅ Only write address & fee to localStorage HERE — when user clicks checkout
  const handleCheckoutClick = () => {
    if (!selectedAddress) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    if (unavailableItemsCount > 0) {
      alert(
        "Please remove unavailable items from your cart before proceeding."
      );
      return;
    }
    if (deliveryFee === null && subtotal <= 500) {
      alert(
        "Delivery fee is still calculating or failed. Please check your address."
      );
      return;
    }

    // ✅ Write to localStorage ONLY at checkout time
    localStorage.setItem(
      "checkout_discount",
      JSON.stringify({ code: couponCode, amount: discount })
    );
    localStorage.setItem(
      "selected_delivery_address",
      JSON.stringify(selectedAddress)
    );
    localStorage.setItem(
      "calculated_delivery_fee",
      JSON.stringify(deliveryFee)
    );

    router.push("/checkout");
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-8 py-32 flex justify-center items-center">
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00b8d9]" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Refreshing Cart...
          </span>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-8 py-20 relative text-center">
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 max-w-2xl mx-auto">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            href="/"
            className="bg-[#00b8d9] text-white px-8 py-3 rounded-2xl font-bold hover:-translate-y-1 transition-transform inline-block shadow-lg shadow-cyan-100"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  const isNewAddressValid =
    formData.firstName &&
    formData.phone &&
    formData.address1 &&
    formData.city &&
    formData.state &&
    formData.zipcode &&
    pinVerified === true;

  return (
    <main className="max-w-7xl mx-auto px-8 py-10 relative">
      {/* ADDRESS MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl p-8 rounded-[2rem] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAddressModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-rose-500 transition bg-slate-50 hover:bg-rose-50 rounded-full p-2"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Delivery Address
            </h3>

            {user && savedAddresses.length > 0 && !useNewAddress && (
              <div className="space-y-4 mb-6">
                {savedAddresses.map((addr) => {
                  const isOutOfZone =
                    addr.zipcode &&
                    addr.zipcode.substring(0, 4) !==
                      sessionZip.substring(0, 4);
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        if (!isOutOfZone) handleSelectSavedAddress(addr);
                      }}
                      className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                        isOutOfZone
                          ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                          : isSelected
                          ? "border-[#00b8d9] bg-cyan-50 cursor-pointer shadow-sm"
                          : "border-slate-100 hover:border-[#00b8d9] cursor-pointer bg-white shadow-sm"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-[#00b8d9] text-white px-2 py-1 rounded-bl-xl text-[10px] font-bold">
                          Selected
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 text-lg">
                          {addr.name}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        {addr.address_line1}, {addr.city}
                      </p>
                      {addr.phone && (
                        <p className="text-xs text-slate-400 font-bold mt-1">
                          📞 {addr.phone}
                        </p>
                      )}
                      {isOutOfZone && (
                        <span className="text-[10px] font-bold text-rose-500 uppercase mt-2 block tracking-widest">
                          Out of delivery zone
                        </span>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={handleAddNewClick}
                  className="w-full py-4 border-2 border-dashed border-[#00b8d9] text-[#00b8d9] rounded-2xl font-bold hover:bg-[#00b8d9]/5 transition-colors"
                >
                  + Add New Address
                </button>
              </div>
            )}

            {(!user ||
              useNewAddress ||
              (user && savedAddresses.length === 0)) && (
              <div className="space-y-6">
                {user && savedAddresses.length > 0 && (
                  <button
                    onClick={() => setUseNewAddress(false)}
                    className="text-sm font-bold text-[#00b8d9] hover:underline mb-2"
                  >
                    ← Back to saved addresses
                  </button>
                )}

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                    Step 1: Locate on Map
                  </p>
                  <button
                    type="button"
                    onClick={handleGetExactLocation}
                    disabled={isLocating}
                    className="w-full mb-4 py-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 font-bold text-[#00b8d9] hover:border-[#00b8d9] transition-all shadow-sm"
                  >
                    {isLocating ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MapPin size={18} />
                    )}{" "}
                    Detect Live Location
                  </button>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 h-56 mb-4 relative z-0 shadow-inner">
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onChange={(lat, lng) => verifyLocationPin(lat, lng)}
                    />
                  </div>
                  {locationError && (
                    <div className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                      {locationError}
                    </div>
                  )}
                  {pinVerified && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                          clipRule="evenodd"
                        />
                      </svg>
                      GPS Verified for zone {sessionZip}
                    </div>
                  )}
                </div>

                <div
                  className={`space-y-4 transition-opacity duration-300 ${
                    !pinVerified
                      ? "opacity-40 pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Step 2: Address Details
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email (Optional)"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <input
                    type="text"
                    name="address1"
                    placeholder="House number and street name *"
                    value={formData.address1}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    name="address2"
                    placeholder="Apartment, suite, etc. (Optional)"
                    value={formData.address2}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City *"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State *"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    />
                    <input
                      type="text"
                      name="zipcode"
                      value={formData.zipcode}
                      className="w-full bg-slate-100 border border-transparent rounded-xl py-3.5 px-4 text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  <button
                    onClick={saveNewAddressAndUse}
                    disabled={!isNewAddressValid}
                    className="w-full mt-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    Save & Use Address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VALIDATION TOAST */}
      <div
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-out ${
          showToast
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-10 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="bg-rose-500 rounded-full p-1 flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="12" y1="19" x2="12.01" y2="19"></line>
            </svg>
          </div>
          <span className="text-sm font-medium text-white whitespace-nowrap">
            Please select a delivery address first
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Shopping <span className="text-[#00b8d9]">Cart</span>
          <span className="text-slate-400 font-medium text-lg ml-2">
            ({cart.length} Items)
          </span>
        </h1>
        {unavailableItemsCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mt-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-bold leading-relaxed">
              You have {unavailableItemsCount} item(s) in your cart that cannot
              be delivered to your currently selected location. Please remove
              them to checkout.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-row gap-12">
        {/* Left Side: Cart Items */}
        <div className="flex-1 flex flex-col gap-6">
          {cart.map((item) => {
            const totalWeight = calculateTotalWeight(item.quantity, item.unit);
            const isUnavailable = item.is_available === false;
            return (
              <div
                key={item.id}
                className={`bg-white p-5 rounded-3xl border flex flex-row gap-6 relative group transition-all ${
                  isUnavailable
                    ? "opacity-60 border-rose-200 bg-rose-50/30"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                {item.unit && !isUnavailable && (
                  <div className="absolute top-0 left-0 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-br-2xl rounded-tl-3xl flex items-center gap-1.5 z-10 border-b border-r border-slate-100">
                    <Scale className="w-3 h-3 opacity-60" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {totalWeight} Total
                    </span>
                  </div>
                )}
                {isUnavailable && (
                  <div className="absolute top-0 left-0 bg-rose-500 text-white px-3 py-1.5 rounded-br-2xl rounded-tl-3xl shadow-sm flex items-center gap-1.5 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Out of Delivery Zone
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition p-2 hover:bg-rose-50 rounded-full z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
                <Link
                  href={isUnavailable ? "#" : `/product/${item.slug}`}
                  className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 relative block mt-3 border border-slate-100"
                >
                  {item.image ? (
                    <img
                      src={`http://localhost:8000${item.image}`}
                      alt={item.name}
                      className={`w-full h-full object-contain ${
                        !isUnavailable &&
                        "group-hover:scale-110 transition-transform duration-500"
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">
                      No Image
                    </div>
                  )}
                </Link>
                <div className="flex-1 flex flex-col justify-between py-1 mt-3">
                  <div>
                    <div className="flex gap-2 items-center mb-1 pr-8">
                      {isUnavailable ? (
                        <h3 className="text-lg font-bold text-slate-500 line-through">
                          {item.name}
                        </h3>
                      ) : (
                        <Link href={`/product/${item.slug}`}>
                          <h3 className="text-lg font-bold text-slate-800 hover:text-[#00b8d9] transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-1">
                      {item.unit
                        ? `₹${item.price.toFixed(2)} per ${item.unit}`
                        : "per unit"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
                    <div
                      className={`flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200 ${
                        isUnavailable && "opacity-50 pointer-events-none"
                      }`}
                    >
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-slate-800 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-[#00b8d9] hover:bg-[#00b8d9] hover:text-white transition font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold block">
                        Price per pack
                      </span>
                      <span
                        className={`text-lg font-extrabold ${
                          isUnavailable
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Summary & Checkout */}
        <div className="w-[380px] flex-shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 sticky top-28 border border-slate-100">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Delivery Address
                </h3>
                {selectedAddress && (
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="text-[10px] font-bold text-[#00b8d9] hover:text-[#009bb3] uppercase tracking-wide"
                  >
                    Change
                  </button>
                )}
              </div>
              {!selectedAddress ? (
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="w-full py-3 px-4 border-2 border-dashed border-[#00b8d9] text-[#00b8d9] bg-[#00b8d9]/5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00b8d9]/10 transition-colors"
                >
                  <span className="text-lg">+</span> Select or Add Address
                </button>
              ) : (
                <div
                  onClick={() => setAddressModalOpen(true)}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-[#00b8d9] transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <MapPin size={12} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {selectedAddress.name}
                        </h4>
                        <span className="text-[8px] font-bold text-slate-500 bg-white border border-slate-200 px-1 py-0.5 rounded">
                          {selectedAddress.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {selectedAddress.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-lg font-extrabold text-slate-800 mb-6">
              Order Summary
            </h2>

            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon Code"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00b8d9] transition font-semibold"
                  disabled={unavailableItemsCount > 0}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={unavailableItemsCount > 0}
                  className="font-bold text-sm text-[#00b8d9] hover:bg-[#00b8d9]/10 px-4 rounded-xl transition disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <div
                  className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${
                    couponError.includes("modified")
                      ? "text-yellow-600"
                      : "text-rose-500"
                  }`}
                >
                  {couponError}
                </div>
              )}
            </div>

            <hr className="border-slate-100 mb-6" />

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span className="text-slate-800 font-bold">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm font-medium text-emerald-500">
                  <span>Discount</span>
                  <span className="font-bold">- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Delivery</span>
                {isCalculatingFee ? (
                  <span className="text-slate-400 font-bold italic text-xs">
                    Calculating...
                  </span>
                ) : deliveryFee === 0 ? (
                  <span className="text-emerald-500 font-bold">Free</span>
                ) : deliveryFee === null ? (
                  <span className="text-slate-400 font-bold text-xs italic">
                    Select Address
                  </span>
                ) : (
                  <span className="text-slate-800 font-bold">
                    ₹{deliveryFee.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-600 font-bold">Total</span>
              <span className="text-2xl font-extrabold text-slate-900">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={
                unavailableItemsCount > 0 ||
                availableItems.length === 0 ||
                isCalculatingFee
              }
              className={`w-full font-bold text-lg py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group ${
                selectedAddress &&
                unavailableItemsCount === 0 &&
                availableItems.length > 0 &&
                !isCalculatingFee
                  ? "bg-[#00b8d9] text-white hover:-translate-y-1 shadow-lg shadow-cyan-100/50"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Checkout Securely
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>

            <div className="mt-6 flex justify-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
              <div className="h-8 w-12 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
                  className="h-full w-auto object-contain"
                  alt="UPI"
                />
              </div>
              <div className="h-8 w-12 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                <img
                  src="https://api.iconify.design/logos:visa.svg"
                  className="h-3 w-auto object-contain"
                  alt="Visa"
                />
              </div>
              <div className="h-8 w-12 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                  className="h-5 w-auto object-contain"
                  alt="Mastercard"
                />
              </div>
              <div className="h-8 w-12 flex items-center justify-center bg-slate-50 rounded border border-slate-100 p-1">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png"
                  className="h-4 w-auto object-contain"
                  alt="Rupay"
                />
              </div>
            </div>

            <p className="text-center text-[10px] text-emerald-500 mt-4 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              🔒 100% Safe & Secure
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartDesktop;