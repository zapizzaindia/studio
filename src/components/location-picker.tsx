
'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { MapPin, Target } from 'lucide-react';
import { Button } from './ui/button';

// Helper to track map movement and update central position
function MapCenterTracker({ onCenterChange }: { onCenterChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    move: () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
    dragend: () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    }
  });
  return null;
}

export default function LocationPicker({ 
  initialLat, 
  initialLng, 
  onConfirm 
}: { 
  initialLat?: number, 
  initialLng?: number, 
  onConfirm: (lat: number, lng: number) => void 
}) {
  // Default to center of India if no position provided
  const [currentPos, setCurrentPos] = useState({ 
    lat: initialLat || 19.0760, 
    lng: initialLng || 72.8777 
  });

  return (
    <div className="relative h-[450px] w-full flex flex-col">
      <div className="flex-1 relative">
        <MapContainer 
          center={[currentPos.lat, currentPos.lng]} 
          zoom={16} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapCenterTracker onCenterChange={(lat, lng) => setCurrentPos({ lat, lng })} />
        </MapContainer>
        
        {/* Fixed Center Marker Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="flex flex-col items-center -translate-y-1/2">
            <div className="relative">
                <MapPin className="h-12 w-12 text-red-600 drop-shadow-2xl fill-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 bg-red-600 rounded-full" />
            </div>
            <div className="h-2 w-2 bg-black/30 rounded-full blur-[2px] mt-1 scale-x-150" />
          </div>
        </div>

        {/* Floating Instructions */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full px-6">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center justify-center gap-2">
                <Target className="h-3 w-3 text-red-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#333]">Drag Map to Pinpoint Your Door</span>
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-white border-t z-[1001]">
        <Button 
          onClick={() => onConfirm(currentPos.lat, currentPos.lng)}
          className="w-full h-14 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all text-sm"
        >
          CONFIRM THIS PIN LOCATION
        </Button>
      </div>
    </div>
  );
}
