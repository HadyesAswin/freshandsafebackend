"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
  slug: string; // ✅ Added slug here
}

interface Category {
  id: number;
  name: string;
  image?: string;
  slug: string;
}

interface Banner {
  id: number;
  image: string;
  url?: string;
}

interface HomeData {
  marquee: string;
  banners: Banner[];
  daily_deals: Product[];
  categories: Category[];
  products: Product[];
  valid_location: boolean;
}

// --- Icons (SVG) ---
const SearchIcon = () => (
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
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

const MapPinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

export default function Home() {
  const router = useRouter(); 
  const [showModal, setShowModal] = useState(false);
  const [zipcode, setZipcode] = useState("");
  const [savedZipcode, setSavedZipcode] = useState<string | null>(null);

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Carousel State
  const [currentBanner, setCurrentBanner] = useState(0);

  // ================= OTP AUTH STATE =================
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  

  // Load user from localStorage on page load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load saved zipcode on page load
  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (storedZip) {
      setSavedZipcode(storedZip);
    } else {
      setShowModal(true);
    }
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!savedZipcode) return;

    const fetchHomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${savedZipcode}`);
        if (!response.ok) throw new Error("Failed to connect");
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [savedZipcode]);

  // 3. Auto-Scroll Banners Logic
  useEffect(() => {
    if (!data?.banners || data.banners.length <= 1) return;
    const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % data.banners.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [data?.banners]);

  // Handlers
  const handleSubmitZip = () => {
    if (zipcode.length !== 6) return;
    localStorage.setItem("zipcode", zipcode);
    setSavedZipcode(zipcode);
    setShowModal(false);
  };

  const hasNoProducts = data && data.valid_location === false;
  
  const sendOTP = async () => {
    if (phone.length < 10) return;
    setAuthLoading(true);
    const res = await fetch("http://localhost:8000/api/v1/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setAuthLoading(false);
    if (res.ok) {
      setStep("otp");
    } else {
      alert("Error sending OTP");
    }
  };

  const verifyOTP = async (withProfile = false) => {
    setAuthLoading(true);
    const res = await fetch("http://localhost:8000/api/v1/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        withProfile
          ? { phone, otp, name, email }
          : { phone, otp }
      ),
    });
    const data = await res.json();
    setAuthLoading(false);

    if (!res.ok) {
      alert(data.detail);
      return;
    }
    if (!data.user.name || !data.user.email) {
      setStep("register");
      return;
    }
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setShowAuthModal(false);
  };

  const completeProfile = async () => {
    const res = await fetch("http://localhost:8000/api/v1/otp/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, email }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.detail);
      return;
    }
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setShowAuthModal(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- LOCATION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 relative text-center border-t-4 border-green-500">
             {savedZipcode && (
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold">✕</button>
            )}
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Enter Zip Code</h2>
            <input
              type="text" value={zipcode} maxLength={6} inputMode="numeric" placeholder="e.g. 682001"
              onChange={(e) => setZipcode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 text-center text-xl font-bold tracking-widest focus:border-green-500 outline-none"
            />
            <button onClick={handleSubmitZip} disabled={zipcode.length !== 6} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400">
              Check Availability
            </button>
          </div>
        </div>
      )}

      {/* --- 1. MARQUEE (Top) --- */}
      <div className="bg-green-900 text-white text-xs font-bold py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee pl-full">
            {data?.marquee || "Welcome to Fresh&Safe! Deliveries available in select locations."}
        </div>
      </div>

      {/* --- 2. HEADER --- */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-20 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
                <div className="text-2xl font-extrabold text-green-600 tracking-tight">
                    Fresh<span className="text-slate-800">&Safe</span>
                </div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
                <input 
                    type="text" 
                    placeholder="Search for vegetables, fruits..." 
                    className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-5 pr-12 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600">
                    <SearchIcon />
                </button>
            </div>

            {/* Icons & Location */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Location Picker */}
              <button 
                  onClick={() => setShowModal(true)}
                  className="flex flex-col items-end text-right group cursor-pointer"
              >
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivering to</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                      <MapPinIcon />
                      {savedZipcode || "Select Location"}
                  </div>
              </button>

              <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

              {/* User Icon */}
              <button
                onClick={() => {
                  if (user) {
                    router.push("/user/account");
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="text-gray-600 hover:text-green-600 transition-transform active:scale-95"
              >
                <UserIcon />
              </button>

              <Link href="/user/cart" className="text-gray-600 hover:text-green-600 transition-transform active:scale-95">
                <CartIcon />
              </Link>
            </div>
          </div>
      </header>

      {/* --- LOADING STATE --- */}
      {loading && !data && (
         <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
            Loading Store...
         </div>
      )}

      {/* --- MAIN CONTENT --- */}
      {!loading && data && (
        <>
            {/* --- 3. BANNER CAROUSEL (Auto-Scrolling) --- */}
            {data.banners.length > 0 && (
                <section className="relative w-full h-48 md:h-[400px] bg-gray-100 overflow-hidden">
                    {/* Slides */}
                    {data.banners.map((banner, index) => (
                        <div 
                            key={banner.id} 
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            <img 
                                src={`http://localhost:8000${banner.image}`} 
                                alt="Banner" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                        {data.banners.map((_, index) => (
                            <button 
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentBanner ? 'bg-white w-6' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 space-y-16">
                
                {/* --- LOCATION ERROR STATE --- */}
                {hasNoProducts && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">We aren't in {savedZipcode} yet 😔</h3>
                        <p className="text-gray-500 mb-6">But you can still browse our categories! Try checking another location later.</p>
                        <button onClick={() => setShowModal(true)} className="bg-white border border-gray-300 px-6 py-2 rounded-lg font-bold hover:border-green-500 hover:text-green-600 transition">
                            Change Zipcode
                        </button>
                    </div>
                )}

                {/* --- 4. CATEGORIES (SHOW ALL) --- */}
                {data.categories.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-8 bg-green-500 rounded-full"></span>
                            Shop By Category
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {data.categories.map((cat) => (
                                <Link key={cat.id} href={`/user/categories/${cat.slug}`} className="group bg-white p-4 rounded-xl border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all text-center">
                                    <div className="w-20 h-20 mx-auto mb-3 bg-gray-50 rounded-full overflow-hidden">
                                        {cat.image ? (
                                            <img src={`http://localhost:8000${cat.image}`} className="w-full h-full object-cover" alt={cat.name} />
                                        ) : <div className="w-full h-full flex items-center justify-center text-xl">🥗</div>}
                                    </div>
                                    <p className="font-bold text-gray-700 group-hover:text-green-700">{cat.name}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- 5. DEAL OF THE DAY (✅ UPDATED LINKING) --- */}
                {!hasNoProducts && data.daily_deals.length > 0 && (
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-3xl">🔥</span> Deal of the Day
                            </h2>
                            {data.daily_deals.length > 4 && (
                                <Link href="/user/deals" className="text-green-600 font-bold text-sm hover:underline">View All Deals →</Link>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {data.daily_deals.slice(0, 4).map((product) => (
                                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                                    
                                    {/* ✅ Clickable Image Link */}
                                    <Link href={`/user/product/${product.slug}`} className="relative h-40 bg-gray-50 overflow-hidden block">
                                        {product.image && (
                                            <img src={`http://localhost:8000${product.image}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                        )}
                                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                                            OFFER
                                        </span>
                                    </Link>
                                    
                                    <div className="p-4 flex flex-col flex-1 justify-between">
                                        <div>
                                            {/* ✅ Clickable Title Link */}
                                            <Link href={`/user/product/${product.slug}`}>
                                                <h3 className="font-bold text-gray-800 truncate mb-1 hover:text-green-600 transition-colors">{product.name}</h3>
                                            </Link>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-black text-red-600">₹{product.price}</span>
                                                {product.original_price && <span className="text-xs text-gray-400 line-through">₹{product.original_price}</span>}
                                            </div>
                                        </div>
                                        
                                        {/* ✅ Changed button to Next.js Link pointing to product page */}
                                        <Link 
                                            href={`/user/product/${product.slug}`} 
                                            className="block text-center w-full mt-3 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                                        >
                                            View & Add
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
      )}

      {/* ================= OTP MODAL ================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70]">
          <div className="bg-white p-8 rounded-2xl w-96 relative shadow-2xl">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setStep("phone");
              }}
              className="absolute top-4 right-4 text-gray-400"
            >
              ✕
            </button>

            {step === "phone" && (
              <>
                <h2 className="text-xl font-bold mb-4">Enter Mobile Number</h2>
                <input
                  type="text"
                  value={phone}
                  maxLength={10}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full border rounded-lg px-4 py-2 mb-4"
                />
                <button
                  onClick={sendOTP}
                  className="w-full py-2 bg-green-600 text-white rounded-lg"
                >
                  {authLoading ? "Sending..." : "Send OTP"}
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
                <input
                  type="text"
                  value={otp}
                  maxLength={4}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="w-full border rounded-lg px-4 py-2 mb-4 text-center"
                />
                <button
                  onClick={verifyOTP}
                  className="w-full py-2 bg-green-600 text-white rounded-lg"
                >
                  {authLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}

            {step === "register" && (
              <>
                <h2 className="text-xl font-bold mb-4">Complete Profile</h2>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 mb-3"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 mb-4"
                />
                <button
                  onClick={completeProfile}
                  className="w-full py-2 bg-green-600 text-white rounded-lg"
                >
                  Save & Continue
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= PROFILE MODAL ================= */}
      {showProfileModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80]">
          <div className="bg-white p-8 rounded-2xl w-96 relative shadow-2xl">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-6">My Profile</h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-400">Name</span>
                <div className="font-semibold">
                  {user.name || "Not provided"}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Phone</span>
                <div className="font-semibold">
                  {user.phone}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Email</span>
                <div className="font-semibold">
                  {user.email || "Not provided"}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                setUser(null);
                setShowProfileModal(false);
              }}
              className="w-full mt-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* --- 6. FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <div className="text-2xl font-extrabold text-white tracking-tight mb-4">
                    Fresh<span className="text-green-500">&Safe</span>
                </div>
                <p className="text-sm text-slate-400">Delivering fresh, organic, and safe products directly to your doorstep. Quality you can trust.</p>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/" className="hover:text-green-400">Home</Link></li>
                    <li><Link href="/about" className="hover:text-green-400">About Us</Link></li>
                    <li><Link href="/contact" className="hover:text-green-400">Contact</Link></li>
                    <li><Link href="/terms" className="hover:text-green-400">Terms & Conditions</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Categories</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/category/vegetables" className="hover:text-green-400">Vegetables</Link></li>
                    <li><Link href="/category/fruits" className="hover:text-green-400">Fruits</Link></li>
                    <li><Link href="/category/meat" className="hover:text-green-400">Meat & Fish</Link></li>
                    <li><Link href="/category/dairy" className="hover:text-green-400">Dairy</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Partner with Us</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/shop-login" className="hover:text-green-400">Outlet Login</Link></li>
                    <li><Link href="/login" className="hover:text-green-400">Admin Login</Link></li>
                </ul>
            </div>
        </div>
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500">
            © 2026 Fresh&Safe. All rights reserved.
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee 20s linear infinite;
        }
        .pl-full {
            padding-left: 100%;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}