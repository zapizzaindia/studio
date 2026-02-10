"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Crown, Pizza, Utensils, Star, ShoppingBag, Search, Filter, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

import type { City, Category, MenuItem, Outlet, Banner } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { OutletSelector } from "@/components/outlet-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection, useUser } from "@/firebase";
import { placeholderImageMap } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

const serviceModes = [
  { id: 'delivery', label: 'Delivery', sub: 'NOW' },
  { id: 'takeaway', label: 'Takeaway', sub: 'Select Store' },
];

const filters = ["All", "Veg", "Non-Veg", "Bestsellers", "New Launches"];

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeMode, setActiveMode] = useState('delivery');
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: banners, loading: bannersLoading } = useCollection<Banner>('banners');
  
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
          <Icon className="h-5 w-5 text-[#14532d]" />
          <h2 className="text-[16px] font-black text-[#14532d] uppercase tracking-wide leading-none">{title}</h2>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
          <Button variant="link" size="sm" onClick={() => router.push('/home/menu')} className="text-[#14532d] p-0 h-auto text-[10px] font-black uppercase">SEE ALL</Button>
        </div>
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
              />
              <div className="absolute top-3 right-3">
                 {item.isAvailableGlobally && (
                   <Badge className="bg-white/90 text-[#14532d] border-none shadow-sm text-[8px] font-black uppercase tracking-tighter flex gap-1 items-center px-1.5 py-0.5">
                     <Flame className="h-2 w-2 text-primary" /> Popular
                   </Badge>
                 )}
              </div>
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
                  <span className="text-[18px] font-black text-[#14532d] leading-none">₹{item.price}</span>
                  <Button 
                    size="sm" 
                    onClick={() => addItem(item)}
                    className="h-8 px-6 bg-[#e31837] text-white font-black text-[11px] rounded shadow-md uppercase active:scale-95 transition-transform hover:bg-[#c61430]"
                  >
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

  const activeBanners = banners?.filter(b => b.active) || [];

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

      {/* Search Bar Section */}
      <div className="bg-white p-4 shadow-sm border-b sticky top-16 z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for pizzas, sides..." 
            className="pl-10 h-12 bg-[#f1f2f6] border-none rounded-xl font-bold placeholder:font-normal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2">
            <Filter className="h-4 w-4 text-[#14532d]" />
          </button>
        </div>
        
        {/* Filter Chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeFilter === filter 
                  ? 'bg-[#14532d] text-white border-[#14532d]' 
                  : 'bg-white text-[#666666] border-gray-200 hover:border-[#14532d]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
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
            {bannersLoading ? (
              <CarouselItem>
                <Skeleton className="w-full aspect-[16/9] md:aspect-[21/9]" />
              </CarouselItem>
            ) : activeBanners.map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                  <Image
                    src={placeholderImageMap.get(banner.imageId)?.imageUrl || ''}
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
                              <span className="text-2xl font-black">₹{banner.price}</span>
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
                />
              </div>
              <span className="text-[10px] font-black text-[#666666] text-center w-24 leading-tight uppercase tracking-tighter">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>

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

      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button 
            onClick={() => router.push('/home/checkout')}
            className="w-full h-14 bg-[#14532d] hover:bg-[#0f4023] text-white flex items-center justify-between px-6 rounded-xl shadow-2xl animate-in slide-in-from-bottom-10"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{totalItems} ITEMS</span>
              <span className="text-lg font-black">₹{totalPrice}</span>
            </div>
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[12px]">
              VIEW CART <ShoppingBag className="h-5 w-5" />
            </div>
          </Button>
        </div>
      )}

      <div className="py-12 px-6 text-center text-muted-foreground/30 font-black italic uppercase tracking-widest text-[32px] opacity-10">
        Zapizza
      </div>
    </div>
  );
}
