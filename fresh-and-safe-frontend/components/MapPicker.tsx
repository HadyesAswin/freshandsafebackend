"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🛑 YOUR SHOP COORDINATES (Change these to your exact shop location)
const SHOP_LAT = 9.9656; // Example: Vyttila Latitude
const SHOP_LNG = 76.3184; // Example: Vyttila Longitude
const MAX_RADIUS_METERS = 15000; // 15km in meters

// ✅ Fix for Leaflet's default marker icons breaking in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle dragging the pin
function DraggableMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setPosition([lat, lng]);

        // ✅ NEW: CALCULATE AND CONSOLE LOG THE DISTANCE
        const shopCenter = L.latLng(SHOP_LAT, SHOP_LNG);
        const droppedPin = L.latLng(lat, lng);
        
        // Leaflet calculates distance in meters, so we divide by 1000 for km
        const distanceKm = (shopCenter.distanceTo(droppedPin) / 1000).toFixed(2);
        
        console.log(`\n📍 --- NEW PIN DROP ---`);
        console.log(`Coordinates: [Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}]`);
        console.log(`Distance to Shop: ${distanceKm} km`);
        
        if (parseFloat(distanceKm) > 15.0) {
            console.warn(`⚠️ WARNING: Location is OUTSIDE the 15km delivery zone!`);
        } else {
            console.log(`✅ SUCCESS: Location is WITHIN the delivery zone.`);
        }
        console.log(`------------------------\n`);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
    />
  );
}

// Component to automatically fly to a new location when GPS is clicked
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12, { animate: true }); // Zoomed out slightly to see the 15km circle
  }, [center, map]);
  return null;
}

export default function MapPicker({ 
  latitude, 
  longitude, 
  shopLat, // ✅ ADDED
  shopLng, // ✅ ADDED
  onChange 
}: { 
  latitude: number | null; 
  longitude: number | null; 
  shopLat?: number; // ✅ ADDED
  shopLng?: number; // ✅ ADDED
  onChange: (lat: number, lng: number) => void 
}) {
  
  // Default to the Shop if no coordinates are provided yet
  const defaultPos: [number, number] = [SHOP_LAT, SHOP_LNG];
  const currentPos: [number, number] = latitude && longitude ? [latitude, longitude] : defaultPos;

  return (
    <div className="w-full h-full min-h-[256px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner z-0 relative">
      <MapContainer 
        center={currentPos} 
        zoom={11} // Start slightly zoomed out to show the whole delivery zone
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", minHeight: "256px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* ✅ The 15km Delivery Radius Visual Circle */}
        {shopLat && shopLng && (
          <Circle 
            center={[shopLat, shopLng]} 
            radius={15000} // 15km
            pathOptions={{ 
              color: '#00b8d9', fillColor: '#00b8d9', 
              fillOpacity: 0.12, weight: 2, dashArray: '5, 5' 
            }} 
          />
        )}

        <DraggableMarker 
          position={currentPos} 
          setPosition={(pos) => onChange(pos[0], pos[1])} 
        />
        <MapUpdater center={currentPos} />
      </MapContainer>
      
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-xs font-bold text-center py-2 rounded-lg border border-gray-300 z-[1000] pointer-events-none shadow-sm">
        Drop the pin <span className="text-[#00b8d9]">inside the blue circle</span>
      </div>
    </div>
  );
}