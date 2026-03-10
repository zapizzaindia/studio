
'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import type { OrderStatus } from '@/lib/types';
import { Bike } from 'lucide-react';

// Custom icons using inline SVGs for better reliability and brand consistency
const createIcon = (color: string, type: 'outlet' | 'customer') => {
  const iconSvg = type === 'outlet' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        ${iconSvg}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1.5 });
    }
  }, [points, map]);
  return null;
}

export default function OrderTrackingMap({ 
  customerCoords, 
  outletCoords,
  status 
}: { 
  customerCoords: { lat: number, lng: number }, 
  outletCoords: { lat: number, lng: number },
  status: OrderStatus
}) {
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    // Fetch road route from OSRM (Open Source Routing Machine)
    const fetchRoute = async () => {
      try {
        // OSRM coordinates format: lng,lat
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${outletCoords.lng},${outletCoords.lat};${customerCoords.lng},${customerCoords.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
          setRoutePoints(coordinates);
          
          const distInKm = (data.routes[0].distance / 1000).toFixed(1);
          setDistance(`${distInKm} KM`);
        } else {
          // Fallback to straight line if routing fails
          setRoutePoints([
            [outletCoords.lat, outletCoords.lng],
            [customerCoords.lat, customerCoords.lng]
          ]);
        }
      } catch (err) {
        console.error("Routing error:", err);
        setRoutePoints([
          [outletCoords.lat, outletCoords.lng],
          [customerCoords.lat, customerCoords.lng]
        ]);
      }
    };

    fetchRoute();
  }, [customerCoords, outletCoords]);

  const outletIcon = useMemo(() => createIcon('#14532d', 'outlet'), []);
  const customerIcon = useMemo(() => createIcon('#e31837', 'customer'), []);

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[outletCoords.lat, outletCoords.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
        />
        
        <Marker position={[outletCoords.lat, outletCoords.lng]} icon={outletIcon} />
        <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerIcon} />
        
        {routePoints.length > 0 && (
          <Polyline 
            positions={routePoints} 
            pathOptions={{
              color: '#14532d',
              weight: 5,
              opacity: 0.2,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Animated Road Path Flow */}
        {routePoints.length > 0 && status !== 'Cancelled' && status !== 'Completed' && (
           <Polyline 
             positions={routePoints} 
             pathOptions={{
               color: '#14532d',
               weight: 4,
               dashArray: '15, 20', // Long dashes for better visibility on roads
               lineCap: 'round',
               lineJoin: 'round',
             }}
             className="animated-polyline"
           />
        )}

        {/* Static Road Line for Final States */}
        {routePoints.length > 0 && (status === 'Cancelled' || status === 'Completed') && (
           <Polyline 
             positions={routePoints} 
             pathOptions={{
               color: status === 'Completed' ? '#14532d' : '#e31837',
               weight: 4,
               opacity: 0.6,
               lineCap: 'round',
               lineJoin: 'round',
             }}
           />
        )}

        {routePoints.length > 0 && <MapBounds points={routePoints} />}
      </MapContainer>

      {/* Distance Overlay */}
      {distance && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2">
          <Bike className="h-3.5 w-3.5 text-[#14532d]" />
          <span className="text-[10px] font-black uppercase tracking-tight text-[#333]">
            By Road: <span className="font-sans tabular-nums">{distance}</span>
          </span>
        </div>
      )}
    </div>
  );
}
