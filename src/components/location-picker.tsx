
'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Target, LocateFixed, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

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

// Sub-component to handle "Locate Me" logic inside MapContainer
function LocateMeControl() {
  const map = useMap();
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation error", description: "Not supported by your browser.", variant: "destructive" });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 18, { animate: true, duration: 1.5 });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error("Locate error:", error);
        toast({ title: "Access Denied", description: "Please enable location services in your browser.", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: '24px', marginLeft: '20px' }}>
      <div className="leaflet-control leaflet-bar border-none shadow-none bg-transparent">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLocate();
          }}
          disabled={isLocating}
          className="flex items-center justify-center bg-white w-12 h-12 rounded-full shadow-2xl border-2 border-[#14532d]/10 text-[#14532d] hover:bg-gray-50 active:scale-90 transition-all disabled:opacity-50"
          title="Detect my location"
        >
          {isLocating ? <Loader2 className="h-6 w-6 animate-spin" /> : <LocateFixed className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
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
  // Default to center of India (Mumbai area) if no position provided
  const [currentPos, setCurrentPos] = useState({ 
    lat: initialLat || 19.0760, 
    lng: initialLng || 72.8777 
  });

  return (
    <div className="relative h-[500px] w-full flex flex-col bg-white">
      <div className="flex-1 relative overflow-hidden">
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
          <LocateMeControl />
        </MapContainer>
        
        {/* Fixed Center Marker Overlay (Visual only, map moves underneath) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="flex flex-col items-center -translate-y-1/2">
            <div className="relative">
                <MapPin className="h-12 w-12 text-[#e31837] drop-shadow-2xl fill-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 bg-[#e31837] rounded-full" />
            </div>
            <div className="h-2 w-2 bg-black/30 rounded-full blur-[2px] mt-1 scale-x-150" />
          </div>
        </div>

        {/* Floating Instructions */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full px-6">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center gap-2 max-w-xs mx-auto">
                <Target className="h-4 w-4 text-[#e31837] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#333]">Move map to pin your door</span>
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-white border-t z-[1001] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
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
