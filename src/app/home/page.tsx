"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Zap, Crown, Pizza, Utensils, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import type { City, Category, MenuItem, Outlet } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { OutletSelector } from "@/components/outlet-selector";
import { Button } from "@/components/ui/button";
import { useCollection, useUser } from "@/firebase";
import { placeholderImageMap } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
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
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeMode, setActiveMode] = useState('delivery');
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  
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

  const Section = ({ title, subtitle, icon: Icon, items }: { title: string, subtitle: string, icon: any, items: MenuItem[] | undefined }) => (
    <div className="bg-white py-8 border-b border-gray-100 last:border-0">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-[16px] font-black text-[#14532d] uppercase tracking-wide leading-none">{title}</h2>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
      </div>

      <div className="flex overflow-x-auto px-6 space-x-4 scrollbar-hide pb-4">
        {menuItemsLoading ? Array.from({length: 3}).map((_, i) => (
          <Skeleton key={i} className="h-[360px] w-64 rounded-xl flex-shrink-0" />
        )) : items?.map((item) => (
          <div key={item.id} className="relative w-64 flex-shrink-0 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col group">
            <div className="relative h-44 w-full">
              <Image
                src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                alt={item.name}
                fill
                className="object-cover"
                data-ai-hint="pizza item"
              />
              <div className="absolute bottom-3 right-3">
                <Button variant="secondary" className="h-6 px-3 bg-black/50 text-white border-0 text-[9px] font-bold rounded-md hover:bg-black/70 backdrop-blur-sm">
                  Customise <ArrowRight className="ml-1 h-2 w-2" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`h-3 w-3 border flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                </div>
                <h4 className="text-[13px] font-black text-[#333333] uppercase truncate tracking-tight">{item.name}</h4>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug font-medium h-8 mb-4">{item.description}</p>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-muted-foreground/80 border-b border-dashed pb-2">
                  <span className="truncate">Regular | New Hand Tossed</span>
                  <ArrowRight className="h-2 w-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[18px] font-black text-[#14532d] leading-none">{item.price}</span>
                  <Button size="sm" className="h-8 px-6 bg-[#e31837] text-white font-black text-[11px] rounded shadow-md uppercase active:scale-95 transition-transform hover:bg-[#c61430]">
                    Add +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f1f2f6]">
      {/* Service Modes Tabs */}
      <div className="flex bg-[#14532d] border-t border-white/10">
        {serviceModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all relative ${
              activeMode === mode.id ? 'bg-white text-[#14532d]' : 'text-white'
            }`}
          >
            <span className="text-[12px] font-bold uppercase tracking-tight">{mode.label}</span>
            <span className={`text-[9px] ${activeMode === mode.id ? 'text-[#14532d]/60' : 'text-white/60'}`}>{mode.sub}</span>
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
                    data-ai-hint="pizza banner"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest mb-1">{banner.subtitle}</span>
                      <h2 className="text-white text-2xl font-black uppercase italic leading-none mb-2">{banner.title}</h2>
                      <div className="flex items-center gap-4">
                          <div className="text-white">
                              <span className="text-[10px] font-bold block opacity-80 uppercase">Starting @</span>
                              <span className="text-2xl font-black">{banner.price}</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-primary text-white font-bold h-8 rounded-full px-4 group"
                            onClick={() => router.push('/home/menu')}
                          >
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

      {/* App Install Promotional Card */}
      <div className="mx-4 mt-6 bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-[11px] font-bold text-[#333333]">Order via Zapizza App for</p>
                <p className="text-[13px] font-black text-[#14532d] uppercase">Real-time Tracking</p>
            </div>
        </div>
        <Button size="sm" className="bg-[#e31837] text-white font-bold h-8 rounded-md px-6 shadow-md uppercase text-[10px]">
            Install
        </Button>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="py-8 bg-white mt-6 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <h2 className="px-6 text-[14px] font-black text-[#14532d] mb-5 uppercase tracking-wide">What are you craving for?</h2>
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
              onClick={() => router.push(`/home/menu?category=${category.id}`)}
            >
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-[#f2f2f2] shadow-sm transition-transform active:scale-90 group-hover:border-primary">
                <Image
                  src={`https://picsum.photos/seed/${category.id}/200/200`}
                  alt={category.name}
                  fill
                  className="object-cover"
                  data-ai-hint="pizza category"
                />
              </div>
              <span className="text-[10px] font-black text-[#666666] text-center w-24 leading-tight uppercase tracking-tighter">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections based on Screenshot */}
      <Section 
        title="Top 10 Bestsellers" 
        subtitle="In Your Locality" 
        icon={Crown} 
        items={menuItems?.slice(0, 5)} 
      />

      <Section 
        title="Popular Veg Delights" 
        subtitle="Free Delivery For Orders Above 149" 
        icon={Star} 
        items={menuItems?.filter(i => i.isVeg && i.category === 'veg-pizzas')} 
      />

      <Section 
        title="Non-Veg Favorites" 
        subtitle="The Meat Lovers Choice" 
        icon={Pizza} 
        items={menuItems?.filter(i => !i.isVeg)} 
      />

      <Section 
        title="Sides & Breads" 
        subtitle="Best Companions To Your Pizza" 
        icon={Utensils} 
        items={menuItems?.filter(i => i.category === 'desserts' || i.category === 'beverages')} 
      />

      <div className="py-12 px-6 text-center text-muted-foreground/30 font-black italic uppercase tracking-widest text-[32px] opacity-10">
        Zapizza
      </div>
    </div>
  );
}
