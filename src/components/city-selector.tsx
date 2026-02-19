
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Loader2 } from "lucide-react";
import type { City } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ZapizzaLogo } from "./icons";
import { useCollection, useFirestore } from "@/firebase";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs } from "firebase/firestore";

type CitySelectorProps = {
  onCitySelect: (city: City) => void;
};

// Haversine formula to calculate distance in KM
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export function CitySelector({ onCitySelect }: CitySelectorProps) {
  const { data: cities, loading } = useCollection<City>('cities');
  const db = useFirestore();
  const { toast } = useToast();
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation error", description: "Not supported by your browser.", variant: "destructive" });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (!db) { setIsDetecting(false); return; }

        try {
          const citySnap = await getDocs(collection(db, 'cities'));
          const allCities = citySnap.docs.map(d => ({ id: d.id, ...d.data() } as City));
          
          let nearest: City | null = null;
          let minDist = Infinity;

          allCities.forEach(city => {
            if (city.latitude && city.longitude) {
              const dist = getDistance(latitude, longitude, city.latitude, city.longitude);
              if (dist < minDist) {
                minDist = dist;
                nearest = city;
              }
            }
          });

          if (nearest) {
            onCitySelect(nearest);
            toast({ title: "Found you!", description: `Identifying outlets in ${nearest.name}.` });
          } else {
            toast({ variant: "destructive", title: "Location mismatch", description: "We haven't launched in your current region yet." });
          }
        } catch (e) {
          toast({ variant: "destructive", title: "Error", description: "Could not fetch city data." });
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
        toast({ variant: "destructive", title: "Permission Denied", description: "Please select your city manually." });
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-background p-4"
    >
      <div className="flex flex-col items-center pt-8 text-center">
        <ZapizzaLogo className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-headline text-3xl font-black text-primary italic uppercase tracking-tighter">Where are you?</h1>
        <p className="max-w-xs text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 opacity-60">
          Select your city to see the menu available in your area.
        </p>
      </div>

      <div className="my-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search for your city" className="pl-10 h-12 rounded-xl font-bold" />
        </div>
        <Button 
          className="mt-3 w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em]" 
          variant="outline"
          onClick={handleDetectLocation}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              DETECTING...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              USE MY CURRENT LOCATION
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">POPULAR CITIES</h2>
        <ul className="grid grid-cols-2 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
          {cities?.map((city) => (
            <motion.li
              key={city.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCitySelect(city)}
            >
              <button className="w-full rounded-2xl border bg-card p-6 text-center font-black uppercase italic tracking-tighter text-lg transition-all hover:border-primary hover:bg-primary/5 active:scale-95 shadow-sm">
                {city.name}
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
