
'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import type { OrderStatus } from '@/lib/types';

// Custom icons using inline SVGs for better reliability and brand consistency
const createIcon = (color: string, type: 'outlet' | 'customer') => {
  const iconSvg = type === 'outlet' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

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
  // Animating from customer to outlet as requested by user
  const points = useMemo(() => [
    [customerCoords.lat, customerCoords.lng] as [number, number],
    [outletCoords.lat, outletCoords.lng] as [number, number]
  ], [outletCoords, customerCoords]);

  const outletIcon = useMemo(() => createIcon('#14532d', 'outlet'), []);
  const customerIcon = useMemo(() => createIcon('#e31837', 'customer'), []);

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={points[0]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
        />
        <Marker position={points[1]} icon={outletIcon} />
        <Marker position={points[0]} icon={customerIcon} />
        <Polyline 
          positions={points} 
          pathOptions={{
            color: '#14532d',
            weight: 3,
            dashArray: '1, 12',
            lineCap: 'round',
            lineJoin: 'round',
          }}
          className="animated-polyline"
        />
        <MapBounds points={points} />
      </MapContainer>
    </div>
  );
}
