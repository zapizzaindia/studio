"use client";

import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import type { City } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ZapizzaLogo } from "./icons";
import { useCollection } from "@/firebase";
import { Skeleton } from "./ui/skeleton";

type CitySelectorProps = {
  onCitySelect: (city: City) => void;
};

export function CitySelector({ onCitySelect }: CitySelectorProps) {
  const { data: cities, loading } = useCollection<City>('cities');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-background p-4"
    >
      <div className="flex flex-col items-center pt-8 text-center">
        <ZapizzaLogo className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-headline text-3xl font-bold">Where are you?</h1>
        <p className="max-w-xs text-muted-foreground">
          Select your city to see the menu available in your area.
        </p>
      </div>

      <div className="my-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search for your city" className="pl-10" />
        </div>
        <Button className="mt-2 w-full" variant="outline">
          <MapPin className="mr-2 h-4 w-4" />
          Use my current location
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="font-headline font-semibold text-muted-foreground">POPULAR CITIES</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-20 w-full" />
          ))}
          {cities?.map((city) => (
            <motion.li
              key={city.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCitySelect(city)}
            >
              <button className="w-full rounded-lg border bg-card p-4 text-center font-semibold text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {city.name}
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
