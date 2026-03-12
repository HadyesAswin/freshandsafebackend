"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Quote, Loader2 } from "lucide-react"; 

// --- Interfaces ---
interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  image?: string;
  slug: string; 
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

interface Testimonial {
  id: number;
  name: string;
  description: string;
  photo?: string;
  place?: string;
}

interface HomeData {
  marquee: string;
  banners: Banner[];
  daily_deals: Product[];
  categories: Category[];
  products: Product[];
  testimonials: Testimonial[]; 
  valid_location: boolean;
}

// --- Icons (SVG) ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
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
  
  const [currentBanner, setCurrentBanner] = useState(0);

  // ================= AUTH STATE =================
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [wishlist, setWishlist] = useState<Product[]>([]);

  // ================= HYBRID LOCATION SEARCH STATE =================
  const [locSearchQuery, setLocSearchQuery] = useState("");
  const [keralaLocations, setKeralaLocations] = useState<any[]>([]);
  const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
  const [isLocSearchingLive, setIsLocSearchingLive] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const locSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // ================= GLOBAL PRODUCT SEARCH STATE =================
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{categories: any[], products: any[]}>({categories: [], products: []});
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);
  const globalSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ✅ LOAD LOCAL JSON ON MOUNT
  useEffect(() => {
    fetch('/kerala_pincodes.json')
      .then(res => res.json())
      .then(data => setKeralaLocations(data))
      .catch(err => console.error("Local JSON not found. Will fallback to API.", err));
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      fetch(`http://localhost:8000/api/v1/wishlist/${parsedUser.id}`)
        .then(res => res.json())
        .then(dbWishlist => {
          setWishlist(dbWishlist);
          localStorage.setItem("wishlist", JSON.stringify(dbWishlist));
        })
        .catch(err => console.error("Failed to fetch DB wishlist", err));
    }
  }, []);

  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (storedZip) {
      setSavedZipcode(storedZip);
    } else {
      setShowModal(true);
    }
  }, []);

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

  useEffect(() => {
    if (!data?.banners || data.banners.length <= 1) return;
    const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % data.banners.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [data?.banners]);

  // Click outside handler to close global search dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
              setShowGlobalDropdown(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= HYBRID LOCATION SEARCH LOGIC =================
  const handleLocSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocSearchQuery(query);

    const extractedZip = query.match(/\b\d{6}\b/);
    if (extractedZip) {
        setZipcode(extractedZip[0]);
    } else {
        setZipcode("");
    }

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
        setLocSuggestions(matches.map(m => ({
            pincode: m.Pincode,
            name: m.Name,
            district: m.District
        })));
        setIsLocSearchingLive(false);
        if (locSearchDebounceRef.current) clearTimeout(locSearchDebounceRef.current);
    } else {
        setLocSuggestions([]);
        setIsLocSearchingLive(true);

        if (locSearchDebounceRef.current) clearTimeout(locSearchDebounceRef.current);
        locSearchDebounceRef.current = setTimeout(async () => {
            try {
                let foundInPostalApi = false;
                
                const postalUrl = isNumber 
                    ? `https://api.postalpincode.in/pincode/${query.trim()}`
                    : `https://api.postalpincode.in/postoffice/${query.trim()}`;
                
                const postalRes = await fetch(postalUrl);
                const postalData = await postalRes.json();

                if (postalData && postalData[0].Status === "Success" && postalData[0].PostOffice) {
                    const keralaResults = postalData[0].PostOffice.filter((po: any) => po.State === "Kerala");
                    
                    if (keralaResults.length > 0) {
                        const liveMatches = keralaResults.map((place: any) => ({
                            pincode: place.Pincode || "",
                            name: place.Name || "Unknown Area",
                            district: place.District || "Kerala"
                        })).slice(0, 8);
                        
                        setLocSuggestions(liveMatches);
                        foundInPostalApi = true;
                    }
                }

                if (!foundInPostalApi && !isNumber) {
                    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&state=Kerala&country=India&format=json&addressdetails=1&limit=8`, {
                        headers: { 'Accept-Language': 'en-US,en' }
                    });
                    const nomData = await nomRes.json();
                    
                    if (nomData && nomData.length > 0) {
                        const liveMatches = nomData.map((place: any) => ({
                            pincode: place.address?.postcode || "",
                            name: place.name || "Unknown Area",
                            district: place.address?.state_district || place.address?.county || place.address?.region || "Kerala"
                        }));
                        setLocSuggestions(liveMatches);
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
  };

  const handleSubmitZip = () => {
    if (zipcode.length !== 6) return;
    localStorage.setItem("zipcode", zipcode);
    setSavedZipcode(zipcode);
    setShowModal(false);
  };

  // ================= GLOBAL SEARCH LOGIC =================
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
      }, 400); // 400ms debounce
  };


  const toggleWishlist = async (product: Product) => {
    let updatedWishlist;
    const isLoved = wishlist.some((item) => item.id === product.id);
    
    if (isLoved) {
      updatedWishlist = wishlist.filter((item) => item.id !== product.id);
    } else {
      updatedWishlist = [...wishlist, product];
    }
    
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      try {
        await fetch("http://localhost:8000/api/v1/wishlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: parsedUser.id,
            product_ids: updatedWishlist.map(item => item.id)
          })
        });
      } catch (error) {
        console.error("Wishlist sync failed", error);
      }
    }
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
        withProfile ? { phone, otp, name, email } : { phone, otp }
      ),
    });
    const result = await res.json();
    setAuthLoading(false);

    if (!res.ok) {
      alert(result.detail);
      return;
    }
    if (!result.user.name || !result.user.email) {
      setStep("register");
      return;
    }
    localStorage.setItem("token", result.access_token);
    localStorage.setItem("user", JSON.stringify(result.user));
    setUser(result.user);
    setShowAuthModal(false);
  };

  const completeProfile = async () => {
    const res = await fetch("http://localhost:8000/api/v1/otp/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, email }),
    });
    const result = await res.json();

    if (!res.ok) {
      alert(result.detail);
      return;
    }
    localStorage.setItem("user", JSON.stringify(result.user));
    setUser(result.user);
    setShowAuthModal(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- HYBRID LOCATION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[28rem] relative border-t-4 border-green-500">
             {savedZipcode && (
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold">✕</button>
            )}
            <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">Delivery Location</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">Search for a place in Kerala or enter your Pincode.</p>
            
            <div className="relative w-full mb-6 text-left">
                <input 
                    type="text" 
                    value={locSearchQuery}
                    onChange={handleLocSearchChange}
                    autoComplete="off" 
                    placeholder="Search Kerala city or pincode..." 
                    className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-semibold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 shadow-sm" 
                />
                
                {locSearchQuery && (
                    <button onClick={() => { setLocSearchQuery(""); setZipcode(""); setShowLocSuggestions(false); setLocSuggestions([]); }} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {showLocSuggestions && (
                    <ul className="absolute w-full bg-white border border-gray-200 rounded-xl mt-2 max-h-60 overflow-y-auto custom-scrollbar z-50 shadow-xl">
                        {isLocSearchingLive ? (
                            <li className="px-4 py-3 text-sm font-semibold text-gray-400 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                                Searching live map...
                            </li>
                        ) : locSuggestions.length > 0 ? (
                            locSuggestions.map((item, idx) => {
                                if (item.error) {
                                    return <li key={idx} className="px-4 py-3 text-sm font-semibold text-red-500">{item.error}</li>;
                                }
                                return (
                                    <li 
                                        key={idx} 
                                        onClick={() => handleLocSelectSuggestion(item.pincode, item.name)}
                                        className="px-4 py-3 text-sm hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between"
                                    >
                                        <div>
                                            <span className="font-extrabold text-gray-800">{item.name}</span> 
                                            {item.pincode && <span className="text-gray-400 ml-1">({item.pincode})</span>}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-gray-300">{item.district}</span>
                                    </li>
                                );
                            })
                        ) : null}
                    </ul>
                )}
            </div>

            <button 
                onClick={handleSubmitZip} 
                disabled={zipcode.length !== 6} 
                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all active:scale-95"
            >
              Check Availability
            </button>
          </div>
        </div>
      )}

      {/* --- 1. MARQUEE --- */}
      <div className="bg-green-900 text-white text-xs font-bold py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee pl-full">
            {data?.marquee || "Welcome to Fresh&Safe! Deliveries available in select locations."}
        </div>
      </div>

      {/* --- 2. HEADER --- */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-20 flex items-center justify-between gap-4">
            
            <Link href="/" className="flex-shrink-0">
                <div className="text-2xl font-extrabold text-green-600 tracking-tight">
                    Fresh<span className="text-slate-800">&Safe</span>
                </div>
            </Link>

            {/* ✅ GLOBAL SEARCH BAR */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4 relative" ref={searchContainerRef}>
                <input 
                    type="text" 
                    value={globalSearchQuery}
                    onChange={handleGlobalSearch}
                    onFocus={() => { if (globalSearchQuery.length >= 2) setShowGlobalDropdown(true); }}
                    placeholder="Search for vegetables, fruits..." 
                    className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-5 pr-12 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600">
                    {isSearchingGlobal ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon />}
                </button>

                {/* ✅ GLOBAL SEARCH DROPDOWN */}
                {showGlobalDropdown && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {searchResults.categories.length === 0 && searchResults.products.length === 0 && !isSearchingGlobal ? (
                            <div className="p-4 text-center text-sm text-gray-500">No results found for "{globalSearchQuery}"</div>
                        ) : (
                            <div className="py-2">
                                {/* Category Results */}
                                {searchResults.categories.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-400 bg-gray-50">Categories</div>
                                        {searchResults.categories.map(cat => (
                                            <Link 
                                                key={cat.slug} 
                                                href={`/user/categories/${cat.slug}`}
                                                onClick={() => setShowGlobalDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-green-50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    {cat.image ? <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="w-full h-full object-cover" /> : <span>📁</span>}
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">{cat.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Product Results */}
                                {searchResults.products.length > 0 && (
                                    <div>
                                        <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-400 bg-gray-50">Products in {savedZipcode}</div>
                                        {searchResults.products.map(prod => (
                                            <Link 
                                                key={prod.slug} 
                                                href={`/user/product/${prod.slug}`}
                                                onClick={() => setShowGlobalDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-green-50 transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0 p-1">
                                                    {prod.image ? <img src={`http://localhost:8000${prod.image}`} alt={prod.name} className="w-full h-full object-contain" /> : <span>📦</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate">{prod.name}</p>
                                                    <p className="text-green-600 font-black text-xs">₹{prod.price}</p>
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

            <div className="flex items-center gap-4 lg:gap-6">
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

              <Link href="/user/wishlist" className="relative text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => {
                  if (user) router.push("/user/account");
                  else setShowAuthModal(true);
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
            {/* ✅ TOP HORIZONTAL CATEGORY BAR */}
            {data.categories.length > 0 && (
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 lg:px-6">
                        <div className="flex items-center justify-center md:justify-between overflow-x-auto scrollbar-hide py-3 gap-6 md:gap-10 whitespace-nowrap">
                            {data.categories.slice(0, 5).map((cat) => (
                                <Link 
                                    key={cat.id} 
                                    href={`/user/categories/${cat.slug}`} 
                                    className="flex items-center gap-2 text-indigo-900 hover:text-green-600 font-semibold text-[13px] md:text-sm transition-colors group flex-shrink-0"
                                >
                                    {cat.image ? (
                                        <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <span className="text-lg group-hover:scale-110 transition-transform">🥩</span>
                                    )}
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- 3. BANNER CAROUSEL --- */}
            {data.banners.length > 0 && (
                <section className="relative w-full h-48 md:h-[400px] bg-gray-100 overflow-hidden">
                    {data.banners.map((banner, index) => (
                        <div 
                            key={banner.id} 
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            {banner.url ? (
                                <Link href={banner.url} className="block w-full h-full cursor-pointer">
                                    <img src={`http://localhost:8000${banner.image}`} alt="Banner" className="w-full h-full object-cover" />
                                </Link>
                            ) : (
                                <img src={`http://localhost:8000${banner.image}`} alt="Banner" className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))}
                    
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

                {/* --- 4. CATEGORIES (GRID BELOW BANNER) --- */}
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

                {/* --- 5. DEAL OF THE DAY --- */}
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
                            {data.daily_deals.slice(0, 4).map((product) => {
                                const isLoved = wishlist.some(item => item.id === product.id);

                                return (
                                  <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col relative">
                                      
                                      <button 
                                        onClick={() => toggleWishlist(product)}
                                        className="absolute top-3 right-3 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                                      >
                                        <Heart className={`w-5 h-5 transition-colors duration-300 ${isLoved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                      </button>

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
                                              <Link href={`/user/product/${product.slug}`}>
                                                  <h3 className="font-bold text-gray-800 truncate mb-1 hover:text-green-600 transition-colors">{product.name}</h3>
                                              </Link>
                                              <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-black text-red-600">₹{product.price}</span>
                                                {/* ✅ Changed from original_price to compare_price */}
                                                {product.compare_price && <span className="text-xs text-gray-400 line-through">₹{product.compare_price}</span>}
                                            </div>
                                          </div>
                                          
                                          <Link     
                                              href={`/user/product/${product.slug}`} 
                                              className="block text-center w-full mt-3 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                                          >
                                              View & Add
                                          </Link>
                                      </div>
                                  </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ✅ 6. TESTIMONIALS SECTION */}
                {data.testimonials && data.testimonials.length > 0 && (
                    <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mt-16">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-4">Loved by our customers</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">See what our community has to say about their Fresh & Safe experience.</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            {data.testimonials.map((testimonial) => (
                                <div key={testimonial.id} className="bg-gray-50 rounded-2xl p-8 relative flex flex-col h-full border border-gray-100 hover:shadow-md transition-shadow">
                                    <Quote className="absolute top-6 right-6 w-8 h-8 text-green-200 fill-green-100" />
                                    
                                    <div className="flex-1 mb-6">
                                        <p className="text-gray-700 leading-relaxed italic relative z-10">
                                            "{testimonial.description}"
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="w-12 h-12 rounded-full bg-green-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                            {testimonial.photo ? (
                                                <img src={`http://localhost:8000${testimonial.photo}`} alt={testimonial.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-green-700 font-black text-lg">
                                                    {testimonial.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{testimonial.name}</h4>
                                            {testimonial.place && (
                                                <p className="text-xs text-gray-500 mt-0.5">{testimonial.place}</p>
                                            )}
                                        </div>
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
            <button onClick={() => { setShowAuthModal(false); setStep("phone"); }} className="absolute top-4 right-4 text-gray-400">✕</button>

            {step === "phone" && (
              <>
                <h2 className="text-xl font-bold mb-4">Enter Mobile Number</h2>
                <input type="text" value={phone} maxLength={10} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full border rounded-lg px-4 py-2 mb-4" />
                <button onClick={sendOTP} className="w-full py-2 bg-green-600 text-white rounded-lg">
                  {authLoading ? "Sending..." : "Send OTP"}
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
                <input type="text" value={otp} maxLength={4} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full border rounded-lg px-4 py-2 mb-4 text-center" />
                <button onClick={verifyOTP} className="w-full py-2 bg-green-600 text-white rounded-lg">
                  {authLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}

            {step === "register" && (
              <>
                <h2 className="text-xl font-bold mb-4">Complete Profile</h2>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2 mb-3" />
                <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-2 mb-4" />
                <button onClick={completeProfile} className="w-full py-2 bg-green-600 text-white rounded-lg">Save & Continue</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= PROFILE MODAL ================= */}
      {showProfileModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80]">
          <div className="bg-white p-8 rounded-2xl w-96 relative shadow-2xl">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-xl font-bold mb-6">My Profile</h2>
            <div className="space-y-4 text-sm">
              <div><span className="text-gray-400">Name</span><div className="font-semibold">{user.name || "Not provided"}</div></div>
              <div><span className="text-gray-400">Phone</span><div className="font-semibold">{user.phone}</div></div>
              <div><span className="text-gray-400">Email</span><div className="font-semibold">{user.email || "Not provided"}</div></div>
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
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
                <div className="text-2xl font-extrabold text-white tracking-tight mb-4">Fresh<span className="text-green-500">&Safe</span></div>
                <p className="text-sm text-slate-400 max-w-sm">Delivering fresh, organic, and safe products directly to your doorstep. Quality you can trust, straight from the source.</p>
            </div>
            
            <div>
                <h4 className="text-white font-bold mb-4">Categories</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/user/categories/vegetables" className="hover:text-green-400 transition-colors">Vegetables</Link></li>
                    <li><Link href="/user/categories/fruits" className="hover:text-green-400 transition-colors">Fruits</Link></li>
                    <li><Link href="/user/categories/meat" className="hover:text-green-400 transition-colors">Meat & Fish</Link></li>
                    <li><Link href="/user/categories/dairy" className="hover:text-green-400 transition-colors">Dairy</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
                    <li><Link href="/user/contact" className="hover:text-green-400 transition-colors">Contact Us</Link></li>
                    <li><Link href="/user/faq" className="hover:text-green-400 transition-colors">FAQ</Link></li>
                    <li><Link href="/user/news" className="hover:text-green-400 transition-colors">News</Link></li>
                    <li><Link href="/user/blogs" className="hover:text-green-400 transition-colors">Blogs</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/user/terms" className="hover:text-green-400 transition-colors">Terms & Conditions</Link></li>
                    <li><Link href="/user/privacy-policy" className="hover:text-green-400 transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/user/refund-policy" className="hover:text-green-400 transition-colors">Refund Policy</Link></li>
                </ul>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 Fresh&Safe. All rights reserved.</p>
            <div className="flex gap-4">
                <Link href="/shop-login" className="hover:text-white transition-colors">Outlet Portal</Link>
                <span>|</span>
                <Link href="/login" className="hover:text-white transition-colors">Admin Portal</Link>
            </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .pl-full { padding-left: 100%; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </main>
  );
}