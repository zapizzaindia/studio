
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, Info, ArrowRight, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { City, Category, MenuItem, Outlet } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { OutletSelector } from "@/components/outlet-selector";
import { Button } from "@/components/ui/button";
import { useCollection, useUser } from "@/firebase";
import { placeholderImageMap } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const serviceModes = [
  { id: 'delivery', label: 'Delivery', sub: 'NOW' },
  { id: 'takeaway', label: 'Takeaway', sub: 'Select Store' },
];

const banners = [
  {
    id: 'banner_1',
    title: 'CHEESE LAVA PULL APART',
    subtitle: 'Freshly Launched!',
    price: '399',
    imageUrl: placeholderImageMap.get('banner_1')?.imageUrl || '',
  },
  {
    id: 'banner_2',
    title: 'ULTIMATE PIZZA PARTY',
    subtitle: 'Limited Time Offer!',
    price: '499',
    imageUrl: placeholderImageMap.get('banner_2')?.imageUrl || '',
  },
  {
    id: 'banner_3',
    title: 'LAVALICIOUS DESSERTS',
    subtitle: 'Sweeten Your Meal!',
    price: '99',
    imageUrl: placeholderImageMap.get('banner_3')?.imageUrl || '',
  },
];

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeMode, setActiveMode] = useState('delivery');
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  
  useEffect(() => {
    setIsHydrated(true);
    const savedCity = localStorage.getItem("zapizza-city");
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    const locationStatus = localStorage.getItem("zapizza-precise-location");
    
    if (savedCity) {
        try { setSelectedCity(JSON.parse(savedCity)); } catch(e) {}
    }
    if (savedOutlet) {
        try { setSelectedOutlet(JSON.parse(savedOutlet)); } catch(e) {}
    }
    if (locationStatus === 'true') {
        setIsLocationDetected(true);
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

  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      toast({
        title: "Locating...",
        description: "Finding your current location...",
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location detected",
            description: "You've been located precisely!",
          });
          setIsLocationDetected(true);
          localStorage.setItem("zapizza-precise-location", "true");
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Location access denied",
            description: "Please enable location permissions in your browser settings.",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Not supported",
        description: "Geolocation is not supported by your browser.",
      });
    }
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

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f1f2f6]">
      {/* Service Modes Tabs */}
      <div className="flex bg-[#00143c] border-t border-white/10">
        {serviceModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all relative ${
              activeMode === mode.id ? 'bg-white text-[#00143c]' : 'text-white'
            }`}
          >
            <span className="text-[12px] font-bold uppercase tracking-tight">{mode.label}</span>
            <span className={`text-[9px] ${activeMode === mode.id ? 'text-[#00143c]/60' : 'text-white/60'}`}>{mode.sub}</span>
            {activeMode === mode.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Hero Banner Carousel */}
      <div className="relative w-full overflow-hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {banners.map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest mb-1">{banner.subtitle}</span>
                      <h2 className="text-white text-2xl font-black uppercase italic leading-none mb-2">{banner.title}</h2>
                      <div className="flex items-center gap-4">
                          <div className="text-white">
                              <span className="text-[10px] font-bold block opacity-80 uppercase">Starting @</span>
                              <span className="text-2xl font-black">{banner.price}</span>
                          </div>
                          <Button size="sm" className="bg-primary text-white font-bold h-8 rounded-full px-4 group">
                              ORDER NOW <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </Button>
                      </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Location Help Bar */}
      {!isLocationDetected && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#007cc3] text-white p-4 flex items-center justify-between mx-4 -mt-6 relative z-10 rounded-lg shadow-xl border-b-4 border-black/10"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-bold leading-tight">
              Give us your exact location<br />for seamless delivery
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDetectLocation}
            className="text-[10px] h-8 bg-white text-[#007cc3] hover:bg-white/90 border-none uppercase font-black px-4 rounded shadow-md"
          >
            Detect location
          </Button>
        </motion.div>
      )}

      {/* App Install Promotional Card */}
      <div className="mx-4 mt-6 bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-[11px] font-bold text-[#333333]">Order via Zapizza App for</p>
                <p className="text-[13px] font-black text-[#00143c] uppercase">Real-time Tracking</p>
            </div>
        </div>
        <Button size="sm" className="bg-[#e31837] text-white font-bold h-8 rounded-md px-6 shadow-md uppercase text-[10px]">
            Install
        </Button>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="py-8 bg-white mt-6 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <h2 className="px-6 text-[14px] font-black text-[#00143c] mb-5 uppercase tracking-wide">What are you craving for?</h2>
        <div className="flex overflow-x-auto px-6 pb-2 space-x-6 scrollbar-hide">
          {categoriesLoading ? Array.from({length: 6}).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          )) : categories?.map((category) => (
            <div 
              key={category.id} 
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
              onClick={() => {
                const el = document.getElementById(`cat-${category.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-[#f2f2f2] shadow-sm transition-transform active:scale-90 group-hover:border-primary">
                <Image
                  src={`https://picsum.photos/seed/${category.id}/200/200`}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[10px] font-black text-[#666666] text-center w-24 leading-tight uppercase tracking-tighter">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex-1 pb-24 bg-white">
        {categories?.map((category) => {
          const categoryItems = menuItems?.filter(i => i.category === category.id) || [];
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} id={`cat-${category.id}`} className="p-6 border-b last:border-0 scroll-mt-24">
              <h3 className="text-base font-black text-[#00143c] mb-6 uppercase tracking-widest flex items-center gap-2">
                <div className="h-4 w-1 bg-primary rounded-full" />
                {category.name}
              </h3>
              <div className="space-y-8">
                {categoryItems.map((item) => (
                  <div key={item.id} className="flex gap-5">
                    <div className="relative h-28 w-28 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border">
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
                          <div className={`h-4 w-4 border-2 mb-1.5 flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                            <div className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                          </div>
                          <h4 className="text-[14px] font-black text-[#333333] leading-tight uppercase tracking-tight">{item.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="text-[15px] font-black text-[#00143c]">{item.price}</span>
                        <Button size="sm" className="h-8 px-6 bg-white text-[#e31837] border-2 border-[#e31837] font-black text-[11px] rounded shadow-md uppercase active:bg-[#e31837] active:text-white transition-colors">
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
          className="fixed bottom-20 left-4 right-4 z-40 flex justify-center"
        >
          <Button 
            className="w-full max-w-md h-14 bg-[#00143c] text-white font-black rounded-xl shadow-[0_10px_30px_rgba(0,20,60,0.3)] flex justify-between items-center px-6 border-b-4 border-black/30"
            onClick={() => !user && router.push('/login')}
          >
            <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">{user ? "1 Item" : "Welcome"}</span>
                <span className="text-[14px] leading-none">{user ? "249" : "Guest User"}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[12px] uppercase tracking-[0.2em] font-black">{user ? "View Cart" : "Login To Order"}</span>
                <ArrowRight className="h-5 w-5" />
            </div>
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
