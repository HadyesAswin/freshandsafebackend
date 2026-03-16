// src/components/navigation/MobileNavbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  LayoutGrid, 
  Search, 
  ShoppingBag, 
  UserCircle, 
  ChevronLeft,
  ArrowUpRight,
  Smartphone,
  Loader2,
  X
} from "lucide-react";

export default function MobileNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // ================= UI STATE =================
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // ================= GLOBAL DATA STATE =================
  const [savedZipcode, setSavedZipcode] = useState<string | null>(null);
  const [apiCategories, setApiCategories] = useState<any[]>([]);

  // ================= AUTH STATE =================
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP' | 'REGISTER'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ================= SEARCH STATE =================
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{categories: any[], products: any[]}>({categories: [], products: []});
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const globalSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent background scrolling
  useEffect(() => {
    if (isSearchOpen || isCategoriesOpen || isLoginOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isSearchOpen, isCategoriesOpen, isLoginOpen]);

  // Initial Load (User & Zipcode)
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    checkUser();
    const interval = setInterval(checkUser, 1000); // Poll for instant logout updates
    window.addEventListener('storage', checkUser);

    const storedZip = localStorage.getItem("zipcode");
    if (storedZip) setSavedZipcode(storedZip);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  // Fetch Categories based on Location
  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const url = savedZipcode 
          ? `http://localhost:8000/api/v1/location-products?zipcode=${savedZipcode}` 
          : `http://localhost:8000/api/v1/location-products`; 

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.categories) setApiCategories(data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };
    fetchNavData();
  }, [savedZipcode]);

  // ================= SEARCH LOGIC =================
  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGlobalSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults({categories: [], products: []});
      return;
    }

    setIsSearchingGlobal(true);

    if (globalSearchDebounceRef.current) clearTimeout(globalSearchDebounceRef.current);
    globalSearchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/location-products/search?q=${encodeURIComponent(query)}${savedZipcode ? `&zipcode=${savedZipcode}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 400);
  };

  // ================= AUTH LOGIC =================
  const closeLoginModal = () => {
    setIsLoginOpen(false);
    setTimeout(() => {
      setLoginStep('PHONE');
      setPhoneNumber("");
      setOtp("");
      setName("");
      setEmail("");
      setError("");
    }, 300);
  };

  const handleGetOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit number");
      return;
    }
    setError("");
    setAuthLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      if (res.ok) setLoginStep('OTP');
      else setError("Error sending OTP");
    } catch (err) {
      setError("Network error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });
      const result = await res.json();
      
      if (!res.ok) {
        setError(result.detail || "Invalid OTP");
        return;
      }

      if (!result.user.name || !result.user.email) {
        if (result.access_token) localStorage.setItem("token", result.access_token);
        setLoginStep('REGISTER');
        return;
      }
      
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);

      // ✅ Notify cart & other components on this page that user logged in
      window.dispatchEvent(new Event('user-login'));

      closeLoginModal();
    } catch (err) {
      setError("Verification failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/otp/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, name, email }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.detail || "Error saving profile");
        return;
      }

      if (result.access_token) localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);

      // ✅ Notify cart & other components on this page that user logged in
      window.dispatchEvent(new Event('user-login'));

      closeLoginModal();
    } catch (err) {
      setError("Network error");
    } finally {
      setAuthLoading(false);
    }
  };

  // ================= DUMMY DATA / FALLBACKS =================
  const bgColors = [
    "bg-orange-100", "bg-red-50", "bg-blue-50", "bg-rose-100", 
    "bg-slate-100", "bg-amber-50", "bg-emerald-50", "bg-pink-50", 
    "bg-gray-100", "bg-purple-50", "bg-yellow-50"
  ];
  
  const popularSearches = [
    "chicken", "mathi", "neymeen", "prawns", "sardine", 
    "ayala", "karimeen", "anchovy", "tuna", "natholi"
  ];

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Categories", href: "#", icon: LayoutGrid, isModalTrigger: true },
    { name: "Search", href: "#", icon: Search, isSpecial: true },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: 2 },
    { name: "Account", href: "#", icon: UserCircle, isAccount: true },
  ];

  return (
    <>
      {/* ==============================
          1. THE NAVBAR (Fixed Bottom)
      ============================== */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-white border-t border-slate-100 pb-safe">
        <div className="grid grid-cols-5 h-[4.5rem] items-end">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.name === "Categories" && isCategoriesOpen);

            // CENTER SEARCH BUTTON
            if (item.isSpecial) {
              return (
                <div key={item.name} className="relative flex flex-col items-center justify-center h-full w-full pb-2">
                  <button
                    onClick={() => {
                      setIsSearchOpen(true);
                      setIsCategoriesOpen(false);
                    }}
                    className={`
                      absolute -top-6 
                      flex items-center justify-center w-14 h-14 rounded-full
                      bg-[#00b8d9] text-white ring-4 ring-white 
                      active:scale-90 transition-transform duration-300 ease-out
                      shadow-lg shadow-cyan-100/50 z-10
                    `}
                  >
                    <Icon size={24} strokeWidth={2} />
                  </button>
                  <div className="p-2 opacity-0 pointer-events-none">
                     <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-medium mt-1 text-slate-400">
                    {item.name}
                  </span>
                </div>
              );
            }

            // MODAL TRIGGERS (CATEGORIES & ACCOUNT)
            if (item.isModalTrigger || item.isAccount) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.isAccount) {
                       if (user) router.push('/account');
                       else setIsLoginOpen(true);
                    } else {
                       setIsCategoriesOpen(true);
                       setIsSearchOpen(false);
                    }
                  }}
                  className="flex flex-col items-center justify-center h-full w-full pb-2 group active:scale-95 transition-transform duration-200 ease-out"
                >
                  <div className={`
                      relative p-2 rounded-2xl transition-all duration-300 ease-out
                      ${isActive ? "bg-emerald-500 text-white" : "text-slate-500 bg-transparent group-hover:bg-slate-50"}
                  `}>
                    <Icon size={22} strokeWidth={1.8} />
                    
                    {/* Exclamation Mark Badge for Logged Out Users */}
                    {item.isAccount && !user && (
                      <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white border-[1.5px] border-white shadow-sm">
                        !
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                    {item.name}
                  </span>
                </button>
              );
            }

            // STANDARD LINKS
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center h-full w-full pb-2 group active:scale-95 transition-transform duration-200 ease-out"
              >
                <div className={`
                    relative p-2 rounded-2xl transition-all duration-300 ease-out
                    ${isActive ? "bg-emerald-500 text-white" : "text-slate-500 bg-transparent group-hover:bg-slate-50"}
                `}>
                  <Icon size={22} strokeWidth={1.8} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ==============================
          2. SEARCH MODAL (Updated w/ API)
      ============================== */}
      <div 
        className={`
          md:hidden fixed inset-0 z-[60] bg-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isSearchOpen ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white pb-safe-top pt-safe-top mt-2">
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-slate-500 active:bg-slate-50 rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={globalSearchQuery}
              onChange={handleGlobalSearch}
              placeholder="Type product name to search" 
              className="w-full bg-slate-100 text-slate-800 placeholder:text-slate-400 text-sm py-3 px-4 rounded-xl outline-none border border-transparent focus:border-[#00b8d9] focus:bg-white transition-all"
              autoFocus={isSearchOpen}
            />
          </div>
        </div>
        
        <div className="h-[calc(100vh-80px)] overflow-y-auto px-4 pb-24">
            
            {/* Show Results OR Popular Searches */}
            {globalSearchQuery.length >= 2 ? (
                <div className="mt-4">
                   {isSearchingGlobal ? (
                       <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                          <Loader2 className="animate-spin text-[#00b8d9]" size={24} />
                          <span className="text-sm font-medium">Searching...</span>
                       </div>
                   ) : searchResults.categories.length === 0 && searchResults.products.length === 0 ? (
                       <div className="text-center py-10 text-slate-500 text-sm font-medium">
                         No results found for "{globalSearchQuery}"
                       </div>
                   ) : (
                       <div className="flex flex-col gap-6">
                          {/* CATEGORY RESULTS */}
                          {searchResults.categories.length > 0 && (
                            <div>
                               <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Categories</h3>
                               <div className="flex flex-col gap-2">
                                  {searchResults.categories.map(cat => (
                                      <Link 
                                          key={cat.slug} 
                                          href={`/categories/${cat.slug}`}
                                          onClick={() => setIsSearchOpen(false)}
                                          className="flex items-center gap-3 px-4 py-2 border border-slate-100 rounded-xl active:bg-slate-50 transition-colors"
                                      >
                                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                              {cat.image ? <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="w-full h-full object-cover" /> : <span>📁</span>}
                                          </div>
                                          <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                                      </Link>
                                  ))}
                               </div>
                            </div>
                          )}

                          {/* PRODUCT RESULTS */}
                          {searchResults.products.length > 0 && (
                            <div>
                               <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Products</h3>
                               <div className="flex flex-col gap-2">
                                  {searchResults.products.map(prod => (
                                      <Link 
                                          key={prod.slug} 
                                          href={`/product/${prod.slug}`}
                                          onClick={() => setIsSearchOpen(false)}
                                          className="flex items-center gap-3 px-4 py-2 border border-slate-100 rounded-xl active:bg-slate-50 transition-colors"
                                      >
                                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                              {prod.image ? <img src={`http://localhost:8000${prod.image}`} alt={prod.name} className="w-full h-full object-cover" /> : <span>📦</span>}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className="font-bold text-slate-800 text-sm truncate">{prod.name}</p>
                                              <p className="text-emerald-600 font-black text-xs mt-0.5">₹{prod.price}</p>
                                          </div>
                                      </Link>
                                  ))}
                               </div>
                            </div>
                          )}
                       </div>
                   )}
                </div>
            ) : (
                <div className="mt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Popular searches</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {popularSearches.map((term, index) => (
                            <button 
                                key={index}
                                onClick={() => setGlobalSearchQuery(term)}
                                className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl bg-white active:bg-slate-50 transition-colors text-left"
                            >
                                <ArrowUpRight size={16} className="text-emerald-500 shrink-0" />
                                <span className="text-sm font-medium text-slate-700">{term}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* ==============================
          3. CATEGORIES MODAL (Updated w/ API)
      ============================== */}
      <div 
        className={`
          md:hidden fixed inset-0 z-[60] bg-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isCategoriesOpen ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white pb-safe-top pt-safe-top mt-2">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCategoriesOpen(false)}
                className="w-10 h-10 -ml-2 flex items-center justify-center text-slate-500 active:bg-slate-50 rounded-full"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-lg font-bold text-slate-900">All Categories</h1>
           </div>
        </div>

        <div className="h-[calc(100vh-80px)] overflow-y-auto px-4 pb-24">
          <div className="mt-6 mb-4">
            <p className="text-xs text-slate-500">Explore our fresh selection</p>
          </div>

          <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {(apiCategories.length > 0 ? apiCategories : [1,2,3,4,5,6,7,8]).map((cat, index) => {
              const colorClass = bgColors[index % bgColors.length];
              
              return (
                <div key={cat.id || index} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => { if(cat.slug) { router.push(`/categories/${cat.slug}`); setIsCategoriesOpen(false); } }}>
                  {/* CHANGED: Removed shadow-sm and updated inner image to cover the full box */}
                  <div className={`
                     w-full aspect-square rounded-2xl ${colorClass} overflow-hidden
                     flex items-center justify-center text-2xl
                     active:scale-95 transition-transform duration-200
                  `}>
                    {cat.image ? (
                        <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="opacity-20 font-black">{cat.name ? cat.name[0] : ""}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-center text-slate-700 leading-tight px-1">
                    {cat.name || "Loading..."}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==============================
          4. ACCOUNT / LOGIN BOTTOM SHEET
      ============================== */}
      <div 
        className={`
          md:hidden fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity duration-300
          ${isLoginOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={closeLoginModal}
      />

      <div 
        className={`
          md:hidden fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[2rem] p-6 pb-12 shadow-2xl
          transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isLoginOpen ? "translate-y-0" : "translate-y-[150%]"} 
        `}
      >
        <button 
          onClick={closeLoginModal}
          className="absolute -top-14 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mt-2">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200 mb-5">
                <Smartphone size={28} />
            </div>

            {/* --- STEP 1: PHONE --- */}
            {loginStep === 'PHONE' && (
              <>
                <h3 className="text-xl font-extrabold text-slate-800 mb-1">Login or Signup</h3>
                <p className="text-slate-400 text-xs mb-8 text-center">Enter your phone number to continue.</p>
                
                <div className="w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-2 focus-within:border-[#00b8d9] focus-within:ring-1 focus-within:ring-[#00b8d9]/20 transition-all">
                  <span className="pl-4 text-slate-500 font-bold text-sm border-r border-slate-200 pr-3 py-3.5">+91</span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(val);
                      setError("");
                    }}
                    placeholder="Mobile Number" 
                    className="flex-1 bg-transparent py-3.5 px-4 text-sm font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>
                
                <div className="w-full h-5 mb-3 text-left flex items-center">
                    {error && <span className="text-[10px] text-rose-500 font-bold ml-1">{error}</span>}
                </div>

                <button 
                  onClick={handleGetOtp}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00b8d9] text-white font-bold py-4 rounded-xl hover:bg-[#00a2bf] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : "Get OTP"}
                </button>
              </>
            )}

            {/* --- STEP 2: OTP --- */}
            {loginStep === 'OTP' && (
              <>
                <h3 className="text-xl font-extrabold text-slate-800 mb-1">Verify OTP</h3>
                <p className="text-slate-400 text-xs mb-8 text-center">
                  Enter the code sent to <span className="font-bold text-slate-800">+91 {phoneNumber}</span>
                </p>
                
                <div className="w-full flex flex-col items-center mb-5">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError("");
                    }}
                    placeholder="• • • •" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-center text-lg font-bold text-slate-800 outline-none focus:border-[#00b8d9] focus:ring-1 focus:ring-[#00b8d9]/20 transition-all tracking-[0.5em]"
                  />
                  <div className="w-full h-5 mt-1 text-center">
                      {error && <span className="text-[10px] text-rose-500 font-bold">{error}</span>}
                  </div>
                </div>

                <button 
                  onClick={handleVerifyOtp}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00b8d9] text-white font-bold py-4 rounded-xl hover:bg-[#00a2bf] active:scale-[0.98] transition-all mb-4 disabled:opacity-70"
                >
                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Login"}
                </button>

                <button 
                  onClick={() => { setLoginStep('PHONE'); setError(""); setOtp(""); }} 
                  className="text-xs font-bold text-slate-400 hover:text-[#00b8d9] transition-colors"
                >
                  Change Phone Number
                </button>
              </>
            )}

            {/* --- STEP 3: REGISTER --- */}
            {loginStep === 'REGISTER' && (
              <>
                <h3 className="text-xl font-extrabold text-slate-800 mb-1">Complete Profile</h3>
                <p className="text-slate-400 text-xs mb-6 text-center">Just a few details to get started.</p>
                
                <div className="w-full flex flex-col gap-3 mb-2">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="Your Full Name" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00b8d9] focus:ring-1 focus:ring-[#00b8d9]/20 transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Your Email Address" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00b8d9] focus:ring-1 focus:ring-[#00b8d9]/20 transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>
                
                <div className="w-full h-5 mb-2 text-left flex items-center">
                    {error && <span className="text-[10px] text-rose-500 font-bold ml-1">{error}</span>}
                </div>

                <button 
                  onClick={handleCompleteProfile}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00b8d9] text-white font-bold py-4 rounded-xl hover:bg-[#00a2bf] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : "Save & Continue"}
                </button>
              </>
            )}

            <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed max-w-[250px]">
              By continuing, you agree to our <a href="#" className="underline hover:text-slate-600">Terms</a> and <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
            </p>
        </div>
      </div>
    </>
  );
}