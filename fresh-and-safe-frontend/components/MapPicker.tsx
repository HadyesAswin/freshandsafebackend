"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
    map.flyTo(center, 16, { animate: true });
  }, [center, map]);
  return null;
}

export default function MapPicker({ 
  latitude, 
  longitude, 
  onChange 
}: { 
  latitude: number | null; 
  longitude: number | null; 
  onChange: (lat: number, lng: number) => void 
}) {
  // Default to Kochi/Kerala if no coordinates are provided yet
  const defaultPos: [number, number] = [10.0246, 76.3075];
  const currentPos: [number, number] = latitude && longitude ? [latitude, longitude] : defaultPos;

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner z-0 relative">
      <MapContainer 
        center={currentPos} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker 
          position={currentPos} 
          setPosition={(pos) => onChange(pos[0], pos[1])} 
        />
        <MapUpdater center={currentPos} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-xs font-bold text-center py-1.5 rounded-lg border border-gray-300 z-[1000] pointer-events-none">
        Drag the blue pin to your exact location
      </div>
    </div>
  );
}