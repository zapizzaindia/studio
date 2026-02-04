
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MapPin, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { City, Category, MenuItem, Outlet, OutletMenuAvailability } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { OutletSelector } from "@/components/outlet-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCollection, useUser } from "@/firebase";
import { placeholderImageMap } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const serviceModes = [
  { id: 'delivery', label: 'Delivery', sub: 'NOW' },
  { id: 'takeaway', label: 'Takeaway', sub: 'Select Store' },
  { id: 'dinein', label: 'Dine-in', sub: 'Select Store' },
];

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeMode, setActiveMode] = useState('delivery');
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  
  const availabilityPath = selectedOutlet ? `outlets/${selectedOutlet.id}/menuAvailability` : '';
  const { data: availabilityData, loading: availabilityLoading } = useCollection<OutletMenuAvailability>(availabilityPath);
  
  useEffect(() => {
    setIsHydrated(true);
    const savedCity = localStorage.getItem("zapizza-city");
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    if (savedCity) {
        try { setSelectedCity(JSON.parse(savedCity)); } catch(e) {}
    }
    if (savedOutlet) {
        try { setSelectedOutlet(JSON.parse(savedOutlet)); } catch(e) {}
    }
  }, []);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    localStorage.setItem("zapizza-city", JSON.stringify(city));
    setSelectedOutlet(null);
    localStorage.removeItem("zapizza-outlet");
  };

  const handleOutletSelect = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    localStorage.setItem("zapizza-outlet", JSON.stringify(outlet));
  };

  if (!isHydrated || userLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Skeleton className="h-12 w-12 rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedCity) {
    return <CitySelector onCitySelect={handleCitySelect} />;
  }

  if (!selectedOutlet) {
    return <OutletSelector cityId={selectedCity.id} onOutletSelect={handleOutletSelect} onBack={() => setSelectedCity(null)} />;
  }

  const banners = [
    placeholderImageMap.get('banner_1'),
    placeholderImageMap.get('banner_2'),
    placeholderImageMap.get('banner_3'),
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* Location Help Bar */}
      <div className="bg-[#0066a2] text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-full">
            <MapPin className="h-4 w-4" />
          </div>
          <p className="text-[11px] font-medium leading-tight">
            Give us your exact location<br />for seamless delivery
          </p>
        </div>
        <Button size="sm" variant="outline" className="text-[10px] h-7 bg-transparent border-white text-white hover:bg-white/10 uppercase font-bold px-4">
          Detect location
        </Button>
      </div>

      {/* Service Modes */}
      <div className="flex border-b">
        {serviceModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-all relative ${
              activeMode === mode.id ? 'bg-[#333333] text-white' : 'bg-white text-muted-foreground'
            }`}
          >
            <span className="text-[10px] font-bold uppercase">{mode.label}</span>
            <span className="text-[8px] opacity-70">{mode.sub}</span>
            {activeMode === mode.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="py-6">
        <h2 className="px-4 text-[13px] font-bold text-[#333333] mb-4">What are you craving for?</h2>
        <div className="flex overflow-x-auto px-4 pb-2 space-x-6 scrollbar-hide">
          {categoriesLoading ? Array.from({length: 6}).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          )) : categories?.map((category) => (
            <div 
              key={category.id} 
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
              onClick={() => {
                const el = document.getElementById(`cat-${category.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-[#f2f2f2] shadow-sm">
                <Image
                  src={`https://picsum.photos/seed/${category.id}/200/200`}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[9px] font-bold text-[#666666] text-center w-16 leading-tight truncate">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Banners */}
      <div className="py-4">
        <h2 className="px-4 text-[13px] font-bold text-[#333333] mb-4">What's New</h2>
        <Carousel className="w-full" opts={{ align: "start", loop: true }}>
          <CarouselContent className="-ml-2 px-4">
            {banners.map((banner, index) => (
              <CarouselItem key={index} className="pl-2 basis-[85%]">
                <div className="relative aspect-[21/9] rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={banner?.imageUrl || ''}
                    alt={banner?.description || ''}
                    fill
                    className="object-cover"
                    data-ai-hint={banner?.imageHint}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Menu Section */}
      <div className="flex-1 pb-16">
        <div className="bg-[#f8f8f8] p-4 flex items-center gap-2">
            <div className="bg-[#ffcc00] p-0.5 rounded-full">
                <Info className="h-3 w-3 text-black" />
            </div>
            <p className="text-[9px] font-bold text-[#333333]">All prices are inclusive of taxes.</p>
        </div>

        {categories?.map((category) => {
          const categoryItems = menuItems?.filter(i => i.category === category.id) || [];
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} id={`cat-${category.id}`} className="p-4 border-b last:border-0 scroll-mt-20">
              <h3 className="text-sm font-bold text-[#333333] mb-4 uppercase tracking-wide">{category.name}</h3>
              <div className="space-y-6">
                {categoryItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`h-3 w-3 border-2 mb-1 flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                          </div>
                          <h4 className="text-[13px] font-bold text-[#333333] leading-tight">{item.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-[13px] font-bold text-[#333333]">₹{item.price}</span>
                        <Button size="sm" className="h-7 px-4 bg-white text-primary border border-primary hover:bg-primary/5 font-bold text-[10px] rounded shadow-sm">
                          ADD
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-20 left-4 right-4 z-20 flex justify-center"
        >
          <Button 
            className="w-full max-w-sm h-12 bg-primary text-white font-bold rounded-lg shadow-xl flex justify-between px-6"
            onClick={() => !user && router.push('/login')}
          >
            <span className="text-xs">{user ? "1 Item | ₹249" : "Login to order"}</span>
            <span className="text-xs uppercase tracking-widest">{user ? "View Cart" : "Continue"}</span>
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
