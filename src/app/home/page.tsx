"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { ArrowRight, Crown, Pizza, Utensils, Star, ShoppingBag, Search, Filter, Flame, X, Check, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import type { City, Category, MenuItem, Outlet, Banner, MenuItemVariation, MenuItemAddon } from "@/lib/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";

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

  // Customization State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<MenuItemVariation | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  
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

  const handleAddClick = (item: MenuItem) => {
    const hasOptions = (item.variations && item.variations.length > 0) || (item.addons && item.addons.length > 0);
    if (hasOptions) {
      setCustomizingItem(item);
      setSelectedVariation(item.variations?.[0] || null);
      setSelectedAddons([]);
    } else {
      addItem(item);
    }
  };

  const handleConfirmCustomization = () => {
    if (customizingItem) {
      addItem(customizingItem, selectedVariation || undefined, selectedAddons);
      setCustomizingItem(null);
    }
  };

  const currentCustomPrice = useMemo(() => {
    if (!customizingItem) return 0;
    const base = selectedVariation ? selectedVariation.price : customizingItem.price;
    const addons = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return base + addons;
  }, [customizingItem, selectedVariation, selectedAddons]);

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
                data-ai-hint="pizza"
              />
              <div className="absolute top-3 right-3">
                 {item.isAvailableGlobally && (
                   <Badge className="bg-white/90 text-[#14532d] border-none shadow-sm text-[8px] font-black uppercase tracking-tighter flex gap-1 items-center px-1.5 py-0.5">
                     <Flame className="h-2 w-2 text-primary" /> Popular
                   </Badge>
                 )}
              </div>
              <div className="absolute bottom-3 right-3">
                <Button 
                  variant="secondary" 
                  onClick={() => handleAddClick(item)}
                  className="h-6 px-3 bg-black/50 text-white border-0 text-[9px] font-bold rounded-md hover:bg-black/70 backdrop-blur-sm"
                >
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
                    onClick={() => handleAddClick(item)}
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
                    data-ai-hint="pizza promotion"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-10">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-2xl"
                    >
                      <Badge className="mb-2 bg-primary text-white border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">
                        {banner.subtitle}
                      </Badge>
                      <h2 className="text-white text-3xl md:text-5xl font-black uppercase italic leading-tight mb-4 tracking-tighter drop-shadow-2xl">
                        {banner.title}
                      </h2>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Starting @</span>
                          <span className="text-3xl font-black text-white leading-none">₹{banner.price}</span>
                        </div>
                        <Button 
                          size="lg" 
                          className="bg-white text-[#14532d] hover:bg-gray-100 font-black h-14 rounded-2xl px-10 shadow-2xl transition-all active:scale-95 group border-none"
                          onClick={() => router.push('/home/menu')}
                        >
                          ORDER NOW <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                        </Button>
                      </div>
                    </motion.div>
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

      <Section 
        title="Top 10 Bestsellers" 
        subtitle="In Your Locality" 
        icon={Crown} 
        items={menuItems?.slice(0, 5)} 
      />

      <Section 
        title="Popular Veg Delights" 
        subtitle="Free Delivery For Orders Above ₹149" 
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

      {/* Customization Dialog */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl p-0 overflow-hidden border-none max-h-[85vh] flex flex-col">
          {customizingItem && (
            <>
              <div className="relative h-48 w-full flex-shrink-0">
                <Image 
                  src={placeholderImageMap.get(customizingItem.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                  alt={customizingItem.name} 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                   <div className={`h-4 w-4 border-2 mb-2 flex items-center justify-center ${customizingItem.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                      <div className={`h-2 w-2 rounded-full ${customizingItem.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                   </div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tight italic">{customizingItem.name}</h2>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* Variations (Sizes) */}
                {customizingItem.variations && customizingItem.variations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#14532d] uppercase tracking-widest">Select Size</h3>
                      <Badge variant="secondary" className="text-[9px] uppercase font-black bg-[#14532d]/10 text-[#14532d]">Required</Badge>
                    </div>
                    <RadioGroup 
                      value={selectedVariation?.name} 
                      onValueChange={(val) => setSelectedVariation(customizingItem.variations?.find(v => v.name === val) || null)}
                      className="space-y-3"
                    >
                      {customizingItem.variations.map((v) => (
                        <div key={v.name} className="flex items-center justify-between bg-[#f1f2f6]/50 p-3 rounded-xl border border-transparent hover:border-[#14532d]/20 transition-all">
                          <Label htmlFor={`v-${v.name}`} className="flex-1 cursor-pointer">
                            <span className="text-sm font-bold text-[#333333] uppercase">{v.name}</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-[#14532d]">₹{v.price}</span>
                            <RadioGroupItem value={v.name} id={`v-${v.name}`} className="border-[#14532d]" />
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Separator />

                {/* Add-ons */}
                {customizingItem.addons && customizingItem.addons.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-[#14532d] uppercase tracking-widest">Extra Toppings</h3>
                    <div className="space-y-3">
                      {customizingItem.addons.map((addon) => (
                        <div key={addon.name} className="flex items-center justify-between bg-[#f1f2f6]/50 p-3 rounded-xl border border-transparent hover:border-[#14532d]/20 transition-all">
                          <Label htmlFor={`a-${addon.name}`} className="flex-1 cursor-pointer">
                            <span className="text-sm font-bold text-[#333333] uppercase">{addon.name}</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-[#14532d]">₹{addon.price}</span>
                            <Checkbox 
                              id={`a-${addon.name}`} 
                              checked={selectedAddons.some(a => a.name === addon.name)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedAddons([...selectedAddons, addon]);
                                else setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
                              }}
                              className="border-[#14532d]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Sides */}
                {customizingItem.recommendedSides && customizingItem.recommendedSides.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-[#14532d] uppercase tracking-widest">Goes well with</h3>
                      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                        {customizingItem.recommendedSides.map(sideId => {
                          const side = menuItems?.find(m => m.id === sideId);
                          if (!side) return null;
                          return (
                            <div key={side.id} className="flex-shrink-0 w-32 bg-white border rounded-xl p-2 shadow-sm">
                              <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                                <Image src={placeholderImageMap.get(side.imageId)?.imageUrl || ''} alt={side.name} fill className="object-cover" />
                              </div>
                              <p className="text-[10px] font-black uppercase text-[#333333] line-clamp-1 mb-1">{side.name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-[#14532d]">₹{side.price}</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 text-primary"
                                  onClick={() => addItem(side)}
                                >
                                  <PlusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-white border-t flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Final Price</span>
                  <span className="text-2xl font-black text-[#14532d]">₹{currentCustomPrice}</span>
                </div>
                <Button 
                  onClick={handleConfirmCustomization}
                  className="bg-[#14532d] hover:bg-[#0f4023] text-white px-10 h-14 rounded-xl font-black uppercase tracking-widest shadow-xl flex-1"
                >
                  ADD TO CART
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

function MenuItemCard({ item, onAdd }: { item: MenuItem, onAdd: () => void }) {
  const hasOptions = (item.variations && item.variations.length > 0) || (item.addons && item.addons.length > 0);

  return (
    <div className="flex gap-5">
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
          <div className="flex flex-col">
            <span className="text-[15px] font-black text-[#14532d]">₹{item.price}</span>
            {hasOptions && <span className="text-[8px] font-bold text-muted-foreground uppercase">Options available</span>}
          </div>
          <Button 
            size="sm" 
            onClick={onAdd}
            className="h-8 px-6 bg-white text-[#e31837] border-2 border-[#e31837] font-black text-[11px] rounded shadow-md uppercase active:bg-[#e31837] active:text-white transition-colors"
          >
            {hasOptions ? 'CUSTOMIZE' : 'ADD'}
          </Button>
        </div>
      </div>
    </div>
  );
}
