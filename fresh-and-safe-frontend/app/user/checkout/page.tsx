"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// ✅ Dynamically import the map so it doesn't break Server-Side Rendering (SSR)
const MapPicker = dynamic(() => import("../../../components/MapPicker"), { ssr: false });

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string; 
}

// Helper function to load Razorpay SDK script into the browser
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Helper to calculate total purchase size for the summary
const calculateTotalWeight = (qty: number, unitStr: string | undefined) => {
  if (!unitStr) return "";
  
  const unit = unitStr.toLowerCase();
  const match = unit.match(/(\d+(\.\d+)?)/); 
  const unitValue = match ? parseFloat(match[0]) : 1;

  if (unit.includes("g") && !unit.includes("k")) {
    const totalG = qty * unitValue;
    return totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
  }
  if (unit.includes("kg")) {
    return `${(qty * unitValue).toFixed(1)}kg`;
  }
  if (unit.includes("pc") || unit.includes("piece")) {
    return `${qty * unitValue} Pieces`;
  }
  return `${qty * unitValue} ${unitStr}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User & Addresses
  const [user, setUser] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Step Management
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Totals & Discounts
  const [discount, setDiscount] = useState({ code: "", amount: 0 });
  
  // Dynamic Delivery Fee State (✅ Changed to null to prevent false "0" Free Delivery)
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  
  // Default Outlet
  const [outletId, setOutletId] = useState<number>(2); 

  // Location Tracking State
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  // Pin Verification State for Checkout
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);
  const [sessionZip, setSessionZip] = useState("");

  // Form Data
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
    paymentMethod: "online",
    note: ""
  });

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedZip = localStorage.getItem("zipcode") || "";
    const storedDiscount = localStorage.getItem("checkout_discount");
    const storedUser = localStorage.getItem("user");
    
    const storedOutlet = localStorage.getItem("outlet_id") || localStorage.getItem("selectedOutlet");
    if (storedOutlet) {
      setOutletId(parseInt(storedOutlet, 10));
    }

    if (!storedCart || JSON.parse(storedCart).length === 0) {
      router.push("/user/cart");
      return;
    }

    setCart(JSON.parse(storedCart));
    
    if (storedZip) {
      setSessionZip(storedZip);
      setFormData(prev => ({ ...prev, zipcode: storedZip }));
    }
    
    if (storedDiscount) setDiscount(JSON.parse(storedDiscount));

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      fetch(`http://localhost:8000/api/v1/orders/my-addresses/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            
            // ✅ FIXED: Only auto-select an address if it is in the current delivery zone!
            const validAddress = data.find((addr: any) => 
                addr.zipcode && addr.zipcode.substring(0, 4) === storedZip.substring(0, 4)
            );

            if (validAddress) {
                setUseNewAddress(false);
                handleSelectAddress(validAddress); 
            } else {
                // If they have addresses, but none match the current city, force "New Address"
                setUseNewAddress(true);
                setFormData(prev => ({
                    ...prev,
                    firstName: parsedUser.name || "",
                    phone: parsedUser.phone || "",
                    email: parsedUser.email || ""
                }));
            }
          } else {
            setFormData(prev => ({
              ...prev,
              firstName: parsedUser.name || "",
              phone: parsedUser.phone || "",
              email: parsedUser.email || ""
            }));
          }
        })
        .catch(err => console.error("Error fetching addresses:", err));
    }

    setLoading(false);
  }, [router]);

  // Calculations
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = 0; 
  // ✅ Prevent NaN errors if deliveryFee is null
  const finalTotal = subtotal + tax + (deliveryFee || 0) - discount.amount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    
    const nameParts = addr.name.split(" ");
    const fName = nameParts[0];
    const lName = nameParts.slice(1).join(" ");

    setFormData(prev => ({
      ...prev,
      firstName: fName,
      lastName: lName,
      phone: addr.phone,
      email: addr.email || prev.email,
      address1: addr.address_line1,
      address2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      zipcode: addr.zipcode,
      latitude: addr.latitude || null, 
      longitude: addr.longitude || null 
    }));
  };

  const handleAddNewClick = () => {
    setUseNewAddress(true);
    setSelectedAddressId(null);
    setPinVerified(null); 
    setFormData({
      firstName: user?.name || "",
      lastName: "",
      email: user?.email || "",
      phone: user?.phone || "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipcode: sessionZip,
      latitude: null,
      longitude: null,
      paymentMethod: "online",
      note: ""
    });
  };

  const verifyLocationPin = async (lat: number, lng: number) => {
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
                      setLocationError(`Mismatched Location! The map pin (${mappedZip}) is too far from your selected store area (${sessionZip}). Delivery is limited to ~15km.`);
                      return; 
                  }
              } else {
                  setPinVerified(true);
                  setLocationError("");
              }

              setFormData(prev => ({
                  ...prev,
                  city: data.address.city || data.address.town || data.address.county || prev.city,
                  state: data.address.state || prev.state,
                  latitude: lat,
                  longitude: lng
              }));
          } else {
              setPinVerified(true); 
              setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
          }
      } catch (err) {
          console.error("Geocoding failed", err);
          setPinVerified(true);
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
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
      (position) => {
        verifyLocationPin(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsLocating(false);
        setLocationError("Location access denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleProceedToStep2 = async () => {
    setIsCalculatingFee(true);

    // ✅ Calculate Dynamic Weight from Cart
    let totalWeightInKg = 0;
    
    cart.forEach(item => {
        if (item.unit) {
            const unit = item.unit.toLowerCase();
            const match = unit.match(/(\d+(\.\d+)?)/);
            const unitValue = match ? parseFloat(match[0]) : 1;
            
            if (unit.includes("kg")) {
                totalWeightInKg += (unitValue * item.quantity);
            } else if (unit.includes("g") && !unit.includes("k")) {
                totalWeightInKg += ((unitValue / 1000) * item.quantity);
            } else {
                 // Fallback for pieces/items without clear weight. Assume 0.5kg per item as a safe default if needed.
                 totalWeightInKg += (0.5 * item.quantity); 
            }
        } else {
             // Fallback if no unit exists
             totalWeightInKg += (0.5 * item.quantity); 
        }
    });

    // Ensure weight is at least 1.0kg for the Qwqer API
    if (totalWeightInKg < 1.0) totalWeightInKg = 1.0;
    
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/calculate-delivery-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlet_id: outletId,
          delivery_latitude: formData.latitude,
          delivery_longitude: formData.longitude,
          delivery_zipcode: formData.zipcode,
          weight: parseFloat(totalWeightInKg.toFixed(2)) // ✅ Send dynamic weight
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (subtotal > 500) {
           setDeliveryFee(0);
        } else {
           setDeliveryFee(data.delivery_fee);
        }
        setStep(2); // ✅ Only proceed if calculation succeeded
      } else {
        const errorData = await res.json();
        // ✅ CRITICAL BUGFIX: If it fails, clear the fee and DO NOT proceed to Step 2.
        setDeliveryFee(null); 
        alert(errorData.detail || "Unable to calculate delivery. This address might be outside our delivery range.");
        return; 
      }
    } catch (error) {
      console.error("Failed to calculate fee:", error);
      // ✅ CRITICAL BUGFIX: Clear fee and block progress.
      setDeliveryFee(null);
      alert("Technical Error: Could not reach delivery service. Please try again.");
      return;
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handleSubmitOrder = async () => {
    // ✅ Security Check: Prevent submitting if no delivery fee was calculated
    if (deliveryFee === null && subtotal <= 500) {
        alert("Delivery fee was not calculated properly. Please re-enter your address.");
        setStep(1);
        return;
    }

    setIsSubmitting(true);

    const resScript = await loadRazorpayScript();
    if (!resScript) {
      alert("Failed to load Razorpay SDK. Are you online?");
      setIsSubmitting(false);
      return;
    }

    const orderPayload = {
      outlet_id: outletId, 
      user_id: user ? user.id : null,
      customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
      customer_phone: formData.phone,
      customer_email: formData.email,
      delivery_name: `${formData.firstName} ${formData.lastName}`.trim(),
      delivery_phone: formData.phone,
      delivery_address_line1: formData.address1,
      delivery_address_line2: formData.address2,
      delivery_city: formData.city,
      delivery_state: formData.state,
      delivery_zipcode: formData.zipcode,
      delivery_latitude: formData.latitude,   
      delivery_longitude: formData.longitude, 
      delivery_fee: deliveryFee || 0, // Fallback safely to 0 if it was successfully marked Free
      payment_method: "online",
      coupon_code: discount.code || null,
      customer_note: formData.note,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price
      }))
    };

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) throw new Error("Order creation failed in backend");
      
      const responseData = await res.json();

      const options = {
        key: responseData.razorpay_key, 
        amount: finalTotal * 100, 
        currency: "INR",
        name: "Fresh and Safe",
        description: `Order ${responseData.order_number}`,
        order_id: responseData.razorpay_order_id,
        
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("http://localhost:8000/api/v1/orders/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              localStorage.removeItem("cart");
              localStorage.removeItem("checkout_discount");
              router.push(`/user/order-success?order_number=${responseData.order_number}`);
            } else {
              alert("Payment verification failed! Please contact support.");
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment.");
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#16a34a", 
        },
        modal: {
          ondismiss: function () {
             setIsSubmitting(false);
          }
        }
      };

      // @ts-ignore
      const rzp1 = new window.Razorpay(options);
      
      rzp1.on('payment.failed', function (response: any){
        alert(`Payment Failed: ${response.error.description}`);
        setIsSubmitting(false);
      });

      rzp1.open();

    } catch (error) {
      console.error(error);
      alert("Something went wrong initializing payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading checkout...</div>;

  const isAddressValid = useNewAddress 
      ? (formData.firstName && formData.phone && formData.address1 && formData.city && formData.state && formData.zipcode && pinVerified === true)
      : (formData.firstName && formData.phone && formData.address1 && formData.city && formData.state && formData.zipcode);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <div className="text-sm font-bold text-gray-500">Secure Checkout 🔒</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative max-w-sm mx-auto">
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
          <div className={`absolute left-0 top-1/2 h-1 bg-green-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-300 ${step === 1 ? 'w-0' : 'w-full'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 ${step >= 1 ? 'bg-green-600 text-white border-white shadow-md' : 'bg-white text-gray-400 border-gray-200'}`}>1</div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 ${step >= 2 ? 'bg-green-600 text-white border-white shadow-md' : 'bg-white text-gray-400 border-gray-200'}`}>2</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          
          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">1. Select Shipping Address</h2>
              
              {!user && (
                 <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
                   Checking out as a guest. <span className="font-bold cursor-pointer underline" onClick={() => router.push('/')}>Log in</span> for faster checkout and to save your addresses!
                 </div>
              )}

              {/* Saved Addresses Cards */}
              {user && savedAddresses.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {savedAddresses.map(addr => {
                    const isOutOfZone = addr.zipcode && addr.zipcode.substring(0, 4) !== sessionZip.substring(0, 4);

                    return (
                      <div 
                        key={addr.id} 
                        onClick={() => { if (!isOutOfZone) handleSelectAddress(addr); }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isOutOfZone 
                            ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50' 
                            : selectedAddressId === addr.id 
                              ? 'border-green-600 bg-green-50 shadow-md cursor-pointer' 
                              : 'border-gray-200 hover:border-green-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-800">{addr.name}</span>
                          {selectedAddressId === addr.id && <span className="text-green-600">✓</span>}
                        </div>
                        <p className="text-sm text-gray-600">{addr.address_line1}</p>
                        {addr.address_line2 && <p className="text-sm text-gray-600">{addr.address_line2}</p>}
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.zipcode}</p>
                        <p className="text-sm text-gray-600 mt-2 font-medium">📞 {addr.phone}</p>
                        
                        {isOutOfZone && (
                          <div className="mt-3 text-[10px] font-bold text-red-500 uppercase bg-red-50 inline-block px-2 py-1 rounded">
                            Out of delivery zone
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Add New Button Card */}
                  <div 
                    onClick={handleAddNewClick}
                    className={`cursor-pointer p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-all ${useNewAddress ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300'}`}
                  >
                    <span className="text-2xl mb-1">+</span>
                    <span className="font-bold">Add a new address</span>
                  </div>
                </div>
              )}

              {/* New Address Form with Map Verification */}
              {(!user || useNewAddress) && (
                <div className="space-y-4 bg-gray-50 p-6 rounded-xl border">
                  <h3 className="font-bold text-gray-800 mb-2">Enter New Address Details</h3>
                  
                  {/* Step 1: Force Map Interaction */}
                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
                      <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Step 1: Set Exact GPS Location</p>
                      
                      <button type="button" onClick={handleGetExactLocation} disabled={isLocating} className="w-full mb-4 py-3.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-black transition-all bg-white text-blue-600 border-blue-200 hover:bg-blue-50 active:scale-[0.98]">
                        {isLocating ? "⏳ Locating Your Exact Spot..." : "📍 Detect My Live Location"}
                      </button>

                      <div className="rounded-2xl overflow-hidden border shadow-inner h-64 mb-4">
                         <MapPicker 
                            latitude={formData.latitude} 
                            longitude={formData.longitude} 
                            onChange={(lat, lng) => verifyLocationPin(lat, lng)} 
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

                  {/* Step 2: Form Details */}
                  <div className={`space-y-4 transition-opacity ${!pinVerified ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Step 2: Enter Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Address Line 1 *</label>
                        <input type="text" name="address1" placeholder="House number and street name" value={formData.address1} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Address Line 2 (Optional)</label>
                        <input type="text" name="address2" placeholder="Apartment, suite, unit, etc." value={formData.address2} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">City *</label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">State *</label>
                          <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Zipcode *</label>
                          <input type="text" name="zipcode" value={formData.zipcode} className="w-full border rounded-lg p-3 outline-none bg-gray-200 cursor-not-allowed text-gray-500 font-bold" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleProceedToStep2} 
                  disabled={!isAddressValid || isCalculatingFee} 
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isCalculatingFee ? <><span className="animate-spin">⏳</span> Calculating Delivery...</> : "Use this address"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ORDER REVIEW & PAYMENT */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">2. Review & Payment</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Cart Summary */}
                <div className="bg-gray-50 p-6 rounded-xl border">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Order Summary</h3>
                  <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity} x {item.name} {item.unit && <span className="font-bold text-gray-800 ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded">({calculateTotalWeight(item.quantity, item.unit)})</span>}
                        </span>
                        <span className="font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    {/* ✅ BUGFIX: UI now correctly handles null vs 0 */}
                    <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : deliveryFee === null ? 'Pending...' : `₹${deliveryFee}`}</span></div>
                    {discount.amount > 0 && (
                      <div className="flex justify-between text-green-600 font-bold"><span>Discount ({discount.code})</span><span>- ₹{discount.amount}</span></div>
                    )}
                  </div>
                  <div className="border-t mt-4 pt-4 flex justify-between text-xl font-black text-gray-800">
                    <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="flex flex-col">
                  
                  {/* Selected Address Quick View */}
                  <div className="mb-6 p-4 border rounded-xl bg-white shadow-sm flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Delivering To</h4>
                      <p className="font-bold text-gray-800">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-gray-600">{formData.address1}, {formData.city}</p>
                      {formData.latitude && (
                        <p className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-wide">📍 GPS Verified</p>
                      )}
                    </div>
                    <button onClick={() => setStep(1)} className="text-sm text-green-600 font-bold hover:underline">Change</button>
                  </div>

                  <h3 className="font-bold text-lg mb-4 text-gray-800">Payment Method</h3>
                  <div className="p-5 border-2 border-green-500 bg-green-50 rounded-xl mb-8 flex items-start">
                    <div className="w-5 h-5 rounded-full border-2 border-green-600 flex items-center justify-center mr-4 mt-0.5">
                      <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block mb-1">Online Payment Secured</span>
                      <span className="text-sm text-gray-600 block">Pay securely using UPI, Credit/Debit Cards, or Netbanking.</span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-auto">
                    <button onClick={() => setStep(1)} disabled={isSubmitting} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">Back</button>
                    <button onClick={handleSubmitOrder} disabled={isSubmitting} className="flex-1 ml-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg flex items-center justify-center">
                      {isSubmitting ? <span className="animate-spin text-xl mr-2">⏳</span> : ""}
                      {isSubmitting ? "Processing Secure Payment..." : `Proceed to Pay • ₹${finalTotal.toFixed(2)}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}