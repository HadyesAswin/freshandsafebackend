"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

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
  
  // ✅ FIX: Default to 2 (Aroor branch) to prevent DB crash if local storage is empty
  const [outletId, setOutletId] = useState<number>(2); 

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
    paymentMethod: "online",
    note: ""
  });

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedZip = localStorage.getItem("zipcode");
    const storedDiscount = localStorage.getItem("checkout_discount");
    const storedUser = localStorage.getItem("user");
    
    // ✅ FIX: Dynamically check if the user selected a specific shop earlier
    const storedOutlet = localStorage.getItem("outlet_id") || localStorage.getItem("selectedOutlet");
    if (storedOutlet) {
      setOutletId(parseInt(storedOutlet, 10));
    }

    if (!storedCart || JSON.parse(storedCart).length === 0) {
      router.push("/user/cart");
      return;
    }

    setCart(JSON.parse(storedCart));
    if (storedZip) setFormData(prev => ({ ...prev, zipcode: storedZip }));
    if (storedDiscount) setDiscount(JSON.parse(storedDiscount));

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Fetch user's saved addresses
      fetch(`http://localhost:8000/api/v1/orders/my-addresses/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            setUseNewAddress(false);
            handleSelectAddress(data[0]); // Auto-select the first saved address
          } else {
            // No addresses, prefill name/phone from account
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
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const finalTotal = subtotal + tax + deliveryFee - discount.amount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Maps a saved DB address to the form data state
  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    
    // Split name into first and last
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
      zipcode: addr.zipcode
    }));
  };

  const handleAddNewClick = () => {
    setUseNewAddress(true);
    setSelectedAddressId(null);
    setFormData({
      firstName: user?.name || "",
      lastName: "",
      email: user?.email || "",
      phone: user?.phone || "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipcode: localStorage.getItem("zipcode") || "",
      paymentMethod: "online",
      note: ""
    });
  };

  // Submit Order
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);

    const orderPayload = {
      outlet_id: outletId, // ✅ This will now safely send 2 (or whatever is in localStorage)
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

      if (!res.ok) throw new Error("Order failed");
      const responseData = await res.json();

      localStorage.removeItem("cart");
      localStorage.removeItem("checkout_discount");
      
      router.push(`/user/order-success?order_number=${responseData.order_number}`);

    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading checkout...</div>;

  // Validation for Step 1
  const isAddressValid = formData.firstName && formData.phone && formData.address1 && formData.city && formData.state && formData.zipcode;

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
                  {savedAddresses.map(addr => (
                    <div 
                      key={addr.id} 
                      onClick={() => handleSelectAddress(addr)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedAddressId === addr.id ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800">{addr.name}</span>
                        {selectedAddressId === addr.id && <span className="text-green-600">✓</span>}
                      </div>
                      <p className="text-sm text-gray-600">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-gray-600">{addr.address_line2}</p>}
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.zipcode}</p>
                      <p className="text-sm text-gray-600 mt-2 font-medium">📞 {addr.phone}</p>
                    </div>
                  ))}
                  
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

              {/* New Address Form (Always shows for guests, or if user clicked "Add New") */}
              {(!user || useNewAddress) && (
                <div className="space-y-4 bg-gray-50 p-6 rounded-xl border">
                  <h3 className="font-bold text-gray-800 mb-2">Enter New Address Details</h3>
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
                        <input type="text" name="zipcode" value={formData.zipcode} onChange={handleInputChange} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-200 cursor-not-allowed" readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button onClick={() => setStep(2)} disabled={!isAddressValid} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all">
                  Use this address
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
                        <span className="text-gray-600">{item.quantity} x {item.name}</span>
                        <span className="font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    {/* <div className="flex justify-between"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div> */}
                    <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span></div>
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
                      {isSubmitting ? <span className="animate-pulse">Processing...</span> : `Proceed to Pay • ₹${finalTotal.toFixed(2)}`}
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