// src/components/navigation/DesktopNavbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, MapPin, ChevronDown, Loader2 } from "lucide-react";

// --- Interfaces ---
interface Category {
  id: number | string;
  name: string;
  image?: string;
  slug: string;
}

export default function DesktopNavbar() {
  const router = useRouter();

  // ================= GENERAL DATA STATE =================
  const [marquee, setMarquee] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0); 
  const [contactInfo, setContactInfo] = useState<{phone?: string, email?: string} | null>(null);

  // ================= LOCATION STATE =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState("Select Location");
  const [savedZipcode, setSavedZipcode] = useState<string | null>(null);
  
  const [locSearchQuery, setLocSearchQuery] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [keralaLocations, setKeralaLocations] = useState<any[]>([]);
  const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
  const [isLocSearchingLive, setIsLocSearchingLive] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [locCheckLoading, setLocCheckLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const locSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // ================= GLOBAL SEARCH STATE =================
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{categories: any[], products: any[]}>({categories: [], products: []});
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);
  const globalSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ================= AUTH STATE =================
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  // ADDED 'REGISTER' TO LOGIN STEPS
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP' | 'REGISTER'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ✅ ADD THESE TWO LINES FOR THE TIMER
  const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 minutes
  const [isExpired, setIsExpired] = useState(false);

  // Fetch Contact Info for the top bar
  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/contact");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setContactInfo(data[0]); // Grab the first office
          }
        }
      } catch (err) {
        console.error("Failed to fetch contact info for navbar:", err);
      }
    };
    fetchContactDetails();
  }, []);


// --- 1. INITIAL LOAD EFFECTS ---
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    checkUser();

    // ✅ Track cart count
    const updateCartCount = () => {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        try {
          const parsed = JSON.parse(storedCart);
          setCartCount(Array.isArray(parsed) ? parsed.length : 0);
        } catch { setCartCount(0); }
      } else {
        setCartCount(0);
      }
    };
    updateCartCount();

    const interval = setInterval(() => { checkUser(); updateCartCount(); }, 1000);
    window.addEventListener('storage', checkUser);

    // 👇 ADD THE AUTO-OPEN LOGIC HERE 👇
    const storedZip = localStorage.getItem("zipcode");
    if (storedZip) {
      setSavedZipcode(storedZip);
    } else {
      // If no zipcode is found, force the modal open
      setIsModalOpen(true); 
    }

    fetch('/kerala_pincodes.json')
      .then(res => res.json())
      .then(data => setKeralaLocations(data))
      .catch(err => console.error("Local JSON not found", err));

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  // Fetch Navbar Data (Marquee & Categories) based on Location
  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const url = savedZipcode 
          ? `http://localhost:8000/api/v1/location-products?zipcode=${savedZipcode}` 
          : `http://localhost:8000/api/v1/location-products`; 

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.marquee) setMarquee(data.marquee);
          if (data.categories) setCategories(data.categories);
        }
      } catch (err) {
        console.error("Error fetching nav data", err);
      }
    };
    fetchNavData();
  }, [savedZipcode]);

  // Click outside to close global search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowGlobalDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- OTP TIMER LOGIC ---
  useEffect(() => {
    // Only run the timer if we are actually on the OTP step
    if (loginStep !== 'OTP') return;

    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, loginStep]);

  // Format the seconds into MM:SS for the UI
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  // --- 2. GLOBAL SEARCH LOGIC ---
  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGlobalSearchQuery(query);

    if (query.trim().length < 2) {
      setShowGlobalDropdown(false);
      setSearchResults({categories: [], products: []});
      return;
    }

    setShowGlobalDropdown(true);
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

  // --- 3. LOCATION SEARCH LOGIC ---
  const handleLocSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocSearchQuery(query);
    setLocError(""); 

    const extractedZip = query.match(/\b\d{6}\b/);
    if (extractedZip) setZipcode(extractedZip[0]);
    else setZipcode("");

    if (!query.trim()) {
      setShowLocSuggestions(false);
      setLocSuggestions([]);
      return;
    }

    setShowLocSuggestions(true);
    const isNumber = /^\d+$/.test(query.trim());

    const matches = keralaLocations.filter(loc => {
      if (isNumber) return loc.Pincode.startsWith(query.trim());
      return loc.Name.toLowerCase().includes(query.trim().toLowerCase());
    }).slice(0, 10);

    if (matches.length > 0) {
      setLocSuggestions(matches.map(m => ({ pincode: m.Pincode, name: m.Name, district: m.District })));
      setIsLocSearchingLive(false);
      if (locSearchDebounceRef.current) clearTimeout(locSearchDebounceRef.current);
    } else {
      setLocSuggestions([]);
      setIsLocSearchingLive(true);

      if (locSearchDebounceRef.current) clearTimeout(locSearchDebounceRef.current);
      locSearchDebounceRef.current = setTimeout(async () => {
        try {
          let foundInPostalApi = false;
          const postalUrl = isNumber ? `https://api.postalpincode.in/pincode/${query.trim()}` : `https://api.postalpincode.in/postoffice/${query.trim()}`;
          const postalRes = await fetch(postalUrl);
          const postalData = await postalRes.json();

          if (postalData && postalData[0].Status === "Success" && postalData[0].PostOffice) {
            const keralaResults = postalData[0].PostOffice.filter((po: any) => po.State === "Kerala");
            if (keralaResults.length > 0) {
              setLocSuggestions(keralaResults.map((place: any) => ({
                pincode: place.Pincode || "", name: place.Name || "Unknown Area", district: place.District || "Kerala"
              })).slice(0, 8));
              foundInPostalApi = true;
            }
          }

          if (!foundInPostalApi && !isNumber) {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&state=Kerala&country=India&format=json&addressdetails=1&limit=8`, { headers: { 'Accept-Language': 'en-US,en' }});
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              setLocSuggestions(nomData.map((place: any) => ({
                pincode: place.address?.postcode || "", name: place.name || "Unknown Area", district: place.address?.state_district || place.address?.county || "Kerala"
              })));
            } else {
              setLocSuggestions([{ error: "No exact places found. Try a nearby town." }]);
            }
          } else if (!foundInPostalApi && isNumber) {
            setLocSuggestions([{ error: "Invalid Pincode or out of Kerala." }]);
          }
        } catch (error) {
          setLocSuggestions([{ error: "Map network error. Try again." }]);
        } finally {
          setIsLocSearchingLive(false);
        }
      }, 500);
    }
  };

  const handleLocSelectSuggestion = (itemPincode: string, itemName: string) => {
    if (!itemPincode) {
        setLocSearchQuery(itemName); 
        setZipcode("");
    } else {
        setLocSearchQuery(`${itemName} (${itemPincode})`);
        setZipcode(itemPincode); 
    }
    setShowLocSuggestions(false);
    setLocError("");
  };

  const handleSubmitZip = async () => {
    if (zipcode.length !== 6) return;
    
    setLocCheckLoading(true);
    setLocError("");

    try {
      const response = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${zipcode}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.valid_location === false) {
          setLocError(`Sorry, delivery is not available for ${zipcode} yet.`);
        } else {
          localStorage.setItem("zipcode", zipcode);
          setSavedZipcode(zipcode);
          setIsModalOpen(false);
          window.location.reload(); 
        }
      } else {
        setLocError("Failed to check availability. Please try again.");
      }
    } catch (error) {
      setLocError("Network error. Please try again.");
    } finally {
      setLocCheckLoading(false);
    }
  };

  // --- 4. AUTH LOGIC ---
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
      if (res.ok) {
        // ✅ RESET THE TIMER WHEN OTP IS SENT
        setTimeLeft(300); 
        setIsExpired(false);
        setLoginStep('OTP');
      } else setError("Error sending OTP");
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

  // NEW: Profile Completion Logic
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

  // --- Realtime Marquee ---
  const MarqueeContent = () => {
    // If backend sends a single merged string (often separated by |), split it so it spaces out nicely
    const contentString = marquee || "";
    const items = contentString.split('|').map(item => item.trim());

    return (
      <div className="flex gap-20 whitespace-nowrap pr-20 text-white normal-case tracking-wide text-xs font-semibold">
        {items.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 1. TOP MARQUEE BAR */}
      <div className={`hidden md:flex bg-[#00b8d9] text-slate-800 text-[10px] uppercase tracking-[0.2em] py-2 px-8 justify-between items-center font-bold ${!marquee ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <div className="flex gap-6 min-w-max z-10 bg-[#00b8d9] pr-4">
  {contactInfo?.phone ? (
    <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition">
      Call: {contactInfo.phone}
    </a>
  ) : (
    <span className="opacity-70 animate-pulse">Loading...</span>
  )}
</div>
        
        <div className="flex-1 overflow-hidden relative mx-6 mask-linear-fade">
          <div className="flex w-max animate-marquee"> 
            <MarqueeContent />
            <MarqueeContent />
            <MarqueeContent />
            <MarqueeContent />
          </div>
        </div>

       <div className="flex gap-6 min-w-max z-10 bg-[#00b8d9] pl-4">
  {contactInfo ? (
    <>
      {/* <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition flex items-center gap-1.5">
         {contactInfo.phone}
      </a> */}
      <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition flex items-center gap-1.5">
        {contactInfo.email}
      </a>
    </>
  ) : (
    <span className="opacity-50 animate-pulse">Loading contact info...</span>
  )}
</div>
      </div>

      {/* 2. MAIN HEADER */}
      <header className="hidden md:flex bg-white/95 backdrop-blur-md sticky top-0 z-40 px-8 h-[84px] border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto flex items-center gap-8 w-full h-full">
          
          <Link href="/" className="relative flex items-center w-[90px] h-full hover:opacity-90 transition-opacity">
            <Image 
              src="/FRESH & SAFE LOGO.png" 
              alt="Fresh & Safe" 
              width={180} 
              height={80}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[75px] max-w-none h-auto object-contain" 
              priority
            />
          </Link>

          {/* Location Trigger */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 hover:opacity-70 transition-opacity group text-left"
          >
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <MapPin size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1 leading-tight">
                {savedZipcode || location} <ChevronDown size={12} className="text-slate-400"/>
              </span>
              <span className="text-[11px] font-medium text-slate-400">Check availability</span>
            </div>
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative" ref={searchContainerRef}>
            <input 
              type="text" 
              value={globalSearchQuery}
              onChange={handleGlobalSearch}
              onFocus={() => { if (globalSearchQuery.length >= 2) setShowGlobalDropdown(true); }}
              placeholder="Search for fresh fish, meat..." 
              className="w-full bg-slate-100 border-2 border-transparent rounded-2xl py-3 px-12 text-sm outline-none focus:bg-white focus:border-[#00b8d9]/30 transition-all"
            />
            {isSearchingGlobal ? (
              <Loader2 className="absolute left-4 top-3.5 text-[#00b8d9] animate-spin" size={18} />
            ) : (
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            )}

            {/* GLOBAL SEARCH DROPDOWN */}
            {showGlobalDropdown && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {searchResults.categories.length === 0 && searchResults.products.length === 0 && !isSearchingGlobal ? (
                      <div className="p-4 text-center text-sm font-medium text-slate-500">No results found for "{globalSearchQuery}"</div>
                  ) : (
                      <div className="py-2">
                          {/* Category Results */}
                          {searchResults.categories.length > 0 && (
                              <div className="mb-2">
                                  <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">Categories</div>
                                  {searchResults.categories.map(cat => (
                                      <Link 
                                          key={cat.slug} 
                                          href={`/categories/${cat.slug}`}
                                          onClick={() => setShowGlobalDropdown(false)}
                                          className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 transition-colors"
                                      >
                                          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                              {cat.image ? <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="w-full h-full object-cover" /> : <span>📁</span>}
                                          </div>
                                          <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                                      </Link>
                                  ))}
                              </div>
                          )}

                          {/* Product Results */}
                          {searchResults.products.length > 0 && (
                              <div>
                                  <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">Products {savedZipcode && `in ${savedZipcode}`}</div>
                                  {searchResults.products.map(prod => (
                                      <Link 
                                          key={prod.slug} 
                                          href={`/product/${prod.slug}`}
                                          onClick={() => setShowGlobalDropdown(false)}
                                          className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 transition-colors group"
                                      >
                                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                              {prod.image ? <img src={`http://localhost:8000${prod.image}`} alt={prod.name} className="w-full h-full object-cover" /> : <span>📦</span>}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className="font-bold text-slate-800 text-sm truncate group-hover:text-[#00b8d9] transition-colors">{prod.name}</p>
                                              <p className="text-emerald-600 font-black text-xs">₹{prod.price}</p>
                                          </div>
                                      </Link>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 min-w-max">
            {/* User Profile Button */}
            <button 
              onClick={() => {
                if (user) router.push('/account'); 
                else setIsLoginOpen(true);
              }}
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#00b8d9] transition-all"
            >
              <User size={24} />
              
              {!user && (
                <span className="absolute top-[8px] right-[8px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-[1.5px] border-white shadow-sm">
                  !
                </span>
              )}
            </button>

            <Link href="/cart" className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center relative hover:bg-slate-800 transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* 3. CATEGORY PILLS */}
      <div className="hidden md:block border-b border-[#eeeadd] px-8 py-3 bg-white">
        <nav className="max-w-6xl mx-auto flex justify-between w-full">
            {categories.length > 0 ? (
              categories.slice(0, 5).map((cat) => (
                  <Link 
                      key={cat.id} 
                      href={`/categories/${cat.slug}`} 
                      className="relative px-4 py-2 text-xs font-semibold text-slate-500 hover:text-[#00b8d9] transition-colors duration-300 group"
                  >
                      {cat.name}
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00b8d9] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                  </Link>
              ))
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-2">
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                </div>
              ))
            )}
        </nav>
      </div>

      {/* 4. LOCATION MODAL */}
      {isModalOpen && (
        <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[400px] p-8 rounded-[2rem] shadow-2xl relative flex flex-col items-center">
                {/* UPDATED: Only show close button if they have a saved zipcode */}
                {savedZipcode && (
                  <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 text-slate-300 hover:text-black transition">✕</button>
                )}
                
                <div className="mb-6">
                  <Image 
                    src="/FRESH & SAFE LOGO.png" 
                    alt="Fresh & Safe" 
                    width={180}
                    height={80}
                    style={{ width: '120px', height: 'auto' }} 
                    className="object-contain" 
                  />
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 mb-1">Choose delivery location</h3>
                <p className="text-slate-400 text-xs mb-6 text-center">Enter your pincode to check availability.</p>
                
                {locError && (
                  <div className="w-full flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold py-2 px-3 rounded-lg mb-3 border border-rose-100">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">!</span>
                    {locError}
                  </div>
                )}

                <div className="relative w-full mb-5 text-left">
                  <input 
                    type="text" 
                    value={locSearchQuery}
                    onChange={handleLocSearchChange}
                    autoComplete="off"
                    placeholder="Enter pincode or city..." 
                    className={`w-full bg-slate-50 border rounded-xl py-3.5 px-4 text-sm font-semibold text-center outline-none transition-all placeholder:text-slate-400 ${
                      locError 
                        ? 'border-rose-500 text-rose-600 focus:ring-4 focus:ring-rose-500/10' 
                        : 'border-slate-200 focus:border-[#00b8d9] focus:ring-4 focus:ring-[#00b8d9]/10'
                    }`}
                  />
                  
                  {locSearchQuery && (
                      <button onClick={() => { setLocSearchQuery(""); setZipcode(""); setShowLocSuggestions(false); setLocSuggestions([]); setLocError(""); }} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  )}

                  {showLocSuggestions && (
                      <ul className="absolute w-full bg-white border border-slate-200 rounded-xl mt-2 max-h-60 overflow-y-auto custom-scrollbar z-50 shadow-sm text-left">
                          {isLocSearchingLive ? (
                              <li className="px-4 py-3 text-sm font-semibold text-slate-400 flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-[#00b8d9]" /> Searching map...
                              </li>
                          ) : locSuggestions.length > 0 ? (
                              locSuggestions.map((item, idx) => {
                                  if (item.error) {
                                      return <li key={idx} className="px-4 py-3 text-sm font-semibold text-rose-500 text-center">{item.error}</li>;
                                  }
                                  return (
                                      <li 
                                          key={idx} 
                                          onClick={() => handleLocSelectSuggestion(item.pincode, item.name)}
                                          className="px-4 py-3 text-sm hover:bg-cyan-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between"
                                      >
                                          <div>
                                              <span className="font-extrabold text-slate-800">{item.name}</span> 
                                              {item.pincode && <span className="text-slate-400 ml-1">({item.pincode})</span>}
                                          </div>
                                          <span className="text-[10px] uppercase font-bold text-slate-300">{item.district}</span>
                                      </li>
                                  );
                              })
                          ) : null}
                      </ul>
                  )}
                </div>

                <button 
                  onClick={handleSubmitZip}
                  disabled={zipcode.length !== 6 || locCheckLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00b8d9] text-white font-bold py-3.5 rounded-xl hover:bg-[#00a2bf] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                    {locCheckLoading ? <Loader2 size={18} className="animate-spin" /> : "Check availability"}
                </button>
            </div>
        </div>
      )}

      {/* 5. LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[400px] p-8 rounded-[2rem] shadow-2xl relative flex flex-col items-center">
                <button onClick={closeLoginModal} className="absolute right-6 top-6 text-slate-300 hover:text-black transition">✕</button>
                
                {/* Logo */}
                <div className="mb-5">
                  <Image 
                    src="/FRESH & SAFE LOGO.png" 
                    alt="Fresh & Safe" 
                    width={180}
                    height={80}
                    style={{ width: '120px', height: 'auto' }} 
                    className="object-contain" 
                  />
                </div>
                
                {/* --- VIEW 1: ENTER PHONE NUMBER --- */}
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
                    
                    {/* Error Message */}
                    <div className="w-full h-5 mb-3 text-left">
                        {error && <span className="text-[10px] text-rose-500 font-bold ml-1">{error}</span>}
                    </div>

                    <button 
                      onClick={handleGetOtp}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-2 bg-[#00b8d9] text-white font-bold py-3.5 rounded-xl hover:bg-[#00a2bf] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {authLoading ? <Loader2 size={18} className="animate-spin" /> : "Get OTP"}
                    </button>
                  </>
                )}

                {/* --- VIEW 2: ENTER OTP --- */}
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-center text-lg font-bold text-slate-800 outline-none focus:border-[#00b8d9] focus:ring-1 focus:ring-[#00b8d9]/20 transition-all tracking-[0.5em]"
                      />
                      {/* Error Message */}
                      <div className="w-full h-5 mt-1 text-center">
                          {error && <span className="text-[10px] text-rose-500 font-bold">{error}</span>}
                      </div>
                    </div>

                    {/* ✅ THE NEW TIMER UI */}
                    <div className="w-full text-center mb-4">
                      {!isExpired ? (
                        <p className="text-[11px] font-bold text-slate-500">
                          OTP expires in: <span className="text-rose-500 text-xs">{formatTime()}</span>
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-[11px] font-bold text-rose-500">OTP has expired!</p>
                          <button 
                            onClick={handleGetOtp}
                            disabled={authLoading}
                            className="text-xs font-bold text-[#00b8d9] hover:underline transition-all"
                          >
                            {authLoading ? "Sending..." : "Resend New OTP"}
                          </button>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleVerifyOtp}
                      // ✅ DISABLE BUTTON IF EXPIRED OR LOADING
                      disabled={authLoading || isExpired}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all mb-4 ${
                        isExpired || authLoading 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-[#00b8d9] text-white hover:bg-[#00a2bf]'
                      }`}
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

                {/* --- VIEW 3: COMPLETE PROFILE (REGISTER) --- */}
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
                    
                    {/* Error Message */}
                    <div className="w-full h-5 mb-2 text-left">
                        {error && <span className="text-[10px] text-rose-500 font-bold ml-1">{error}</span>}
                    </div>

                    <button 
                      onClick={handleCompleteProfile}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-2 bg-[#00b8d9] text-white font-bold py-3.5 rounded-xl hover:bg-[#00a2bf] active:scale-[0.98] transition-all mb-4 disabled:opacity-70"
                    >
                        {authLoading ? <Loader2 size={18} className="animate-spin" /> : "Save & Continue"}
                    </button>
                  </>
                )}

                <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed">
                  By continuing, you agree to our <a href="/terms" className="underline hover:text-slate-600">Terms</a> and <a href="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</a>.
                </p>
            </div>
        </div>
      )}
    </>
  );
}