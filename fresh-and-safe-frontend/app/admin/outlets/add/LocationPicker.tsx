"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search, Loader2, MapPin } from "lucide-react";

// Fix for default marker icons missing in Next.js/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  lat: number | string;
  lng: number | string;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Fixed: Only fly to the new location when the actual Lat/Lng values change!
function MapUpdater({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    // Only move if we have valid coordinates
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
    }
  }, [lat, lng, zoom, map]); // Dependencies strictly bound to the numbers
  
  return null;
}

export default function LocationPicker({ lat, lng, onLocationSelect }: LocationPickerProps) {
  // Default center to India
  const defaultCenter: [number, number] = [20.5937, 78.9629]; 
  
  // Safely parse numbers
  const numericLat = lat ? Number(lat) : defaultCenter[0];
  const numericLng = lng ? Number(lng) : defaultCenter[1];

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Free OpenStreetMap Geocoding
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    
    // Pass coordinates to parent (OutletForm)
    onLocationSelect(newLat, newLng); 
    
    // Clear dropdown and update search box text
    setSearchResults([]); 
    setSearchQuery(result.display_name); 
  };

  // Component to handle direct map clicks
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      
      {/* Search Bar Area */}
      <div className="relative z-20 w-full">
        {/* CHANGED FROM <form> TO <div> to fix the hydration/nesting error */}
        <div className="flex gap-2">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // Capture the Enter key safely without submitting the parent form
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Stops the Outlet form from submitting
                  handleSearch();
                }
              }}
              placeholder="Search for a city, landmark, or street..." 
              className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all p-2.5 pl-10 shadow-sm"
            />
          </div>
          <button 
            type="button" // CHANGED TO "button" SO IT DOESN'T SUBMIT THE OUTLET FORM
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-60 overflow-y-auto overflow-x-hidden z-50">
            {searchResults.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSearchResult(res)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <span className="line-clamp-2">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The Map */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner relative z-0">
        <MapContainer 
          center={[numericLat, numericLng]} 
          zoom={lat && lng ? 15 : 4} 
          style={{ height: "350px", width: "100%", zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Draggable marker placed at coordinates */}
          {lat && lng && <Marker position={[numericLat, numericLng]} />}
          
          <MapClickHandler />
          
          {/* This reliably moves the map when you click a search result */}
          <MapUpdater lat={numericLat} lng={numericLng} zoom={lat && lng ? 15 : 4} />
          
        </MapContainer>
      </div>
    </div>
  );
}