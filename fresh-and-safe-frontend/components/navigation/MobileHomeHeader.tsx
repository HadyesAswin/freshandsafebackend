// app/(user)/components/navigation/MobileHomeHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Bell, X, Search, Navigation, MapPin, Loader2 } from "lucide-react";

export default function MobileHomeHeader() {
  const pathname = usePathname();
  
  // ================= UI STATE =================
  const [showOffers, setShowOffers] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // ================= GENERAL DATA STATE =================
  const [marquee, setMarquee] = useState<string>("");

  // ================= LOCATION STATE =================
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

  // --- 1. INITIAL LOAD EFFECTS ---
  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (storedZip) {
      setSavedZipcode(storedZip);
    } else {
      // Force open if no zipcode
      setIsLocationOpen(true);
    }

    // Load Kerala Pincodes JSON
    fetch('/kerala_pincodes.json')
      .then(res => res.json())
      .then(data => setKeralaLocations(data))
      .catch(err => console.error("Local JSON not found", err));
  }, []);

  // Fetch Navbar Data (Marquee) based on Location
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
        }
      } catch (err) {
        console.error("Error fetching nav data", err);
      }
    };
    fetchNavData();
  }, [savedZipcode]);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isLocationOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isLocationOpen]);

  // --- 2. LOCATION SEARCH LOGIC ---
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
          setLocError(`Delivery is not available for ${zipcode} yet.`);
        } else {
          localStorage.setItem("zipcode", zipcode);
          setSavedZipcode(zipcode);
          setIsLocationOpen(false);
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

  if (pathname !== "/") return null;

  // 1. CONTENT GROUP FOR MARQUEE (Mapped from API)
  const OfferContent = () => {
    const contentString = marquee || "🎉 Grab 20% OFF on your first order! Use: FIRST20 | 🚛 Free Delivery on orders above ₹499";
    const items = contentString.split('|').map(item => item.trim());

    return (
      <div className="flex items-center gap-12 pr-12 min-w-max">
        {items.map((item, index) => (
          <span key={index} className="text-white text-xs font-bold tracking-wide flex items-center gap-2">
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        
        {/* TOP ROW */}
        <div className="px-4 py-3 flex items-center justify-between bg-white relative z-50">
          <div className="flex items-center gap-3">
            
            <div className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
              <MapPin size={18} />
            </div>

            <button 
              onClick={() => setIsLocationOpen(true)}
              className="flex flex-col items-start active:opacity-70 transition-opacity"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Delivering to
              </span>
              <div className="flex items-center gap-1 text-slate-800">
                <span className="text-sm font-extrabold truncate max-w-[140px]">
                  {savedZipcode || "Select Location"}
                </span>
                <ChevronDown size={14} className="text-[#00b8d9]" strokeWidth={3} />
              </div>
            </button>
          </div>

          <button 
            onClick={() => setShowOffers(!showOffers)}
            className={`
              relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95
              ${showOffers ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}
            `}
          >
            {showOffers ? <X size={18} /> : <Bell size={18} />}
            {!showOffers && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>
        </div>

        {/* 2. OFFERS MARQUEE */}
        <div 
          className={`
            overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${showOffers ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className="bg-[#00b8d9] h-10 flex items-center relative overflow-hidden w-full">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#00b8d9] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#00b8d9] to-transparent z-10"></div>
            
            <div className="flex w-max animate-marquee">
              <OfferContent />
              <OfferContent />
              <OfferContent />
              <OfferContent />
            </div>
          </div>
        </div>
      </header>

      {/* LOCATION BOTTOM SHEET */}
      <div 
        // ADDED md:hidden HERE
        className={`
          md:hidden fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity duration-300
          ${isLocationOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={() => {
          // Only allow closing if they have a saved zipcode
          if (savedZipcode) setIsLocationOpen(false);
        }}
      />

      <div 
        // ADDED md:hidden HERE
        className={`
          md:hidden fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[2rem] p-6 pb-10 shadow-2xl
          transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isLocationOpen ? "translate-y-0" : "translate-y-[150%]"} 
        `}
      >
        {/* Only show the close X if they have a saved zipcode */}
        {savedZipcode && (
          <button 
            onClick={() => setIsLocationOpen(false)}
            className="absolute -top-14 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-extrabold text-slate-800">Search Your Location</h3>
          
          {/* Error Message using the exact minimal styling from desktop, mapped to mobile flow */}
          {locError && (
            <div className="w-full flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold py-2 px-3 rounded-lg border border-rose-100">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">!</span>
              {locError}
            </div>
          )}

          <div className="relative w-full">
            <input 
              type="text" 
              value={locSearchQuery}
              onChange={handleLocSearchChange}
              autoComplete="off"
              placeholder="Enter pincode or city..." 
              className={`w-full bg-slate-100 border rounded-xl py-4 pl-4 pr-10 text-sm font-semibold outline-none transition-all ${
                locError 
                  ? 'border-rose-500 text-rose-600 focus:bg-rose-50' 
                  : 'border-transparent focus:bg-white focus:border-[#00b8d9]'
              }`}
            />
            {locSearchQuery ? (
              <button 
                onClick={() => { setLocSearchQuery(""); setZipcode(""); setShowLocSuggestions(false); setLocSuggestions([]); setLocError(""); }} 
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            ) : (
              <Search className="absolute right-4 top-4 text-slate-400" size={18} />
            )}

            {/* Suggestions Dropdown mapped to bottom sheet layout */}
            {showLocSuggestions && (
                <ul className="absolute left-0 w-full bg-white border border-slate-200 rounded-xl mt-2 max-h-48 overflow-y-auto custom-scrollbar z-50 shadow-lg text-left">
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
          
          {/* Button changed to Check Availability to match backend logic */}
          <button 
            onClick={handleSubmitZip}
            disabled={zipcode.length !== 6 || locCheckLoading}
            className="w-full bg-slate-900 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {locCheckLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Check Availability"
            )}
          </button>
        </div>
      </div>
    </>
  );
}