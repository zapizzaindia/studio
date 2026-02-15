
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  Pizza, 
  Star, 
  TrendingUp, 
  ChevronRight, 
  Bike, 
  ShoppingBasket, 
  Store, 
  Crown, 
  ShieldAlert,
  ShoppingBag,
  PlusCircle,
  Clock
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">("delivery");

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

  const activeBanners = banners?.filter(b => b.active) || [];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f8f9fa] pb-32">
      {/* Welcome Header with Custom GIF Background */}
      <div className="relative bg-[#14532d] text-white px-6 pt-12 pb-64 rounded-b-[40px] shadow-lg overflow-hidden">
        {/* CUSTOM GIF SLOT - Update the src URL with your direct GIF link */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <img 
              src="https://jumpshare.com/s/SLpdAMrhVcxT9ckCqvFB"
              alt="Custom Promotional Background" 
              className="w-full h-full object-cover opacity-70 grayscale brightness-125"
              onError={(e) => {
                // Fallback to placeholder if GIF link fails
                e.currentTarget.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80";
              }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#14532d]/20 via-[#14532d]/60 to-[#14532d]" />
          
          {/* Decorative Floating Icon */}
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 opacity-10"
          >
            <Pizza className="w-24 h-24" />
          </motion.div>
        </div>

        <div className="relative z-10 flex justify-between items-start mb-2">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Welcome Back,</p>
            <h1 className="text-2xl font-black italic tracking-tight">{user?.displayName?.split(' ')[0] || 'Gourmet'}!</h1>
          </div>
          
          <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md">
            <button 
              onClick={() => setOrderType("delivery")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${orderType === "delivery" ? 'bg-white text-[#14532d]' : 'text-white/60'}`}
            >
              <Bike className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
            </button>
            <button 
              onClick={() => setOrderType("takeaway")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${orderType === "takeaway" ? 'bg-white text-[#14532d]' : 'text-white/60'}`}
            >
              <ShoppingBasket className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Takeaway</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 -mt-10">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#14532d] transition-colors" />
          <Input 
            placeholder="Search for deliciousness..." 
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl font-bold placeholder:font-normal focus-visible:ring-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#14532d]/5 p-1.5 rounded-lg">
            <Filter className="h-4 w-4 text-[#14532d]" />
          </button>
        </div>
      </div>

      {/* Hero Banners */}
      <div className="mt-8 px-6">
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {bannersLoading ? (
              <CarouselItem><Skeleton className="w-full h-48 rounded-3xl" /></CarouselItem>
            ) : activeBanners.map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-lg group">
                  <Image src={placeholderImageMap.get(banner.imageId)?.imageUrl || ''} alt={banner.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#14532d]/90 via-[#14532d]/40 to-transparent flex flex-col justify-center p-6">
                    <Badge className="w-fit mb-2 bg-accent text-accent-foreground font-black uppercase text-[8px] tracking-widest">{banner.subtitle}</Badge>
                    <h2 className="text-white text-xl font-black uppercase italic leading-tight mb-2 drop-shadow-md">{banner.title}</h2>
                    <p className="text-white font-black text-lg">₹{banner.price}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Circular Explore Menu */}
      <div className="mt-10 px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-[#14532d] uppercase tracking-tighter">Explore Menu</h2>
          <Button variant="ghost" size="sm" className="text-xs font-black uppercase text-[#14532d] gap-1 pr-0" onClick={() => router.push('/home/menu')}>
            See All <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {categoriesLoading ? Array.from({length: 6}).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-full" />
          )) : categories?.map((cat) => (
            <div 
              key={cat.id} 
              className="flex flex-col items-center gap-2 group cursor-pointer"
              onClick={() => router.push(`/home/menu?category=${cat.id}`)}
            >
              <div className="relative aspect-square w-full rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#14532d] transition-all shadow-md active:scale-95">
                <Image src={`https://picsum.photos/seed/${cat.id}/300/300`} alt={cat.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
              <span className="text-[10px] font-black text-[#14532d] uppercase tracking-tighter text-center line-clamp-1">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Items Scroll */}
      <div className="mt-12">
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-[#14532d]" />
            <h2 className="text-lg font-black text-[#14532d] uppercase tracking-tighter">Trending Now</h2>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">The community's favorites</p>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-5 scrollbar-hide pb-4">
          {menuItems?.slice(0, 5).map((item) => (
            <div key={item.id} className="relative w-48 flex-shrink-0 bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden flex flex-col group">
              <div className="relative h-32 w-full">
                <Image src={placeholderImageMap.get(item.imageId)?.imageUrl || ''} alt={item.name} fill className="object-cover" />
                <div className="absolute top-3 left-3">
                  <div className={`h-3 w-3 border flex items-center justify-center bg-white rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col items-center text-center">
                <h4 className="text-[11px] font-black text-[#333333] uppercase leading-tight line-clamp-1 mb-1">{item.name}</h4>
                <p className="text-[14px] font-black text-[#14532d] mb-3">₹{item.price}</p>
                <Button 
                  size="sm" 
                  onClick={() => handleAddClick(item)}
                  className="w-full h-8 bg-white border-2 border-[#14532d] text-[#14532d] font-black text-[10px] rounded-xl uppercase hover:bg-[#14532d] hover:text-white transition-all shadow-md"
                >
                  ADD +
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bestseller Vertical List */}
      <div className="mt-12 px-6">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-5 w-5 text-[#14532d] fill-[#14532d]" />
          <h2 className="text-lg font-black text-[#14532d] uppercase tracking-tighter">Bestsellers</h2>
        </div>
        <div className="space-y-6">
          {menuItems?.slice(0, 6).map((item) => (
            <div key={item.id} className="flex gap-4 bg-white p-4 rounded-[32px] shadow-lg border border-gray-50 group active:scale-[0.98] transition-transform">
              <div className="relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden shadow-md">
                <Image src={placeholderImageMap.get(item.imageId)?.imageUrl || ''} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`h-3 w-3 border flex items-center justify-center bg-white rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                  </div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Bestseller</span>
                </div>
                <h4 className="text-[13px] font-black text-[#333333] uppercase leading-tight tracking-tight mb-1">{item.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className={`h-2.5 w-2.5 ${i < 4 ? 'text-accent fill-accent' : 'text-gray-200 fill-gray-200'}`} />
                  ))}
                  <span className="text-[9px] font-bold text-muted-foreground ml-1">(120+)</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[15px] font-black text-[#14532d]">₹{item.price}</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddClick(item)}
                    className="h-8 px-6 bg-[#14532d] text-white font-black text-[10px] rounded-xl uppercase shadow-md active:scale-95 transition-transform"
                  >
                    ADD
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Franchise & Trust */}
      <div className="mt-16 px-6 space-y-12">
        <div className="bg-[#14532d] p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-white text-2xl font-black uppercase italic leading-tight mb-2 tracking-tighter">
              ENQUIRE ABOUT<br />ZAPIZZA FRANCHISE
            </h2>
            <p className="text-white/70 text-xs font-bold mb-6 max-w-[200px]">Join India's fastest growing pizza chain. 700+ Outlets across the globe.</p>
            <Button className="bg-white text-[#14532d] font-black uppercase text-[10px] tracking-widest rounded-2xl h-12 px-8 shadow-xl hover:bg-gray-100 transition-all">
              ENQUIRE NOW
            </Button>
          </div>
          <div className="absolute top-0 right-0 opacity-5 translate-x-1/4 -translate-y-1/4">
            <Store className="h-48 w-48" />
          </div>
        </div>

        <div className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-[32px] flex items-center gap-5">
          <div className="bg-accent/10 p-4 rounded-3xl">
            <ShieldAlert className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#333333] uppercase mb-1 tracking-tighter">Beware of Scams!</h3>
            <p className="text-[10px] font-bold text-muted-foreground leading-snug">Zapizza never asks for payments or OTPs on unofficial calls or messages.</p>
          </div>
        </div>
      </div>

      {/* Loyalty Progress Tracker (Bottom Reminder) */}
      <div className="mt-12 px-6">
        <div className="bg-white text-[#14532d] p-6 rounded-[32px] shadow-lg border border-[#14532d]/10 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary fill-primary" />
              <span className="font-black text-sm uppercase tracking-widest">Loyalty Progress</span>
            </div>
            <Badge className="bg-[#14532d] text-white text-[9px] font-black uppercase">GOLD MEMBER</Badge>
          </div>
          <p className="text-xs font-bold mb-4 leading-snug text-[#333333]">
            You're close! Just <span className="font-black">₹1000</span> more to unlock <span className="font-black italic text-[#14532d]">ACE LEVEL</span> rewards.
          </p>
          <div className="space-y-2">
            <Progress value={65} className="h-3 bg-[#14532d]/10" />
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter opacity-50">
              <span>₹0</span>
              <span>₹1000 to ACE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 px-6 text-center text-muted-foreground/30 font-black italic uppercase tracking-widest text-[32px] opacity-10">
        Zapizza
      </div>

      {/* Floating View Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button 
            onClick={() => router.push('/home/checkout')}
            className="w-full h-16 bg-[#14532d] hover:bg-[#0f4023] text-white flex items-center justify-between px-8 rounded-[24px] shadow-2xl animate-in slide-in-from-bottom-10 border-none"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{totalItems} ITEMS</span>
              <span className="text-xl font-black tracking-tight">₹{totalPrice}</span>
            </div>
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[13px]">
              VIEW CART <ShoppingBag className="h-5 w-5" />
            </div>
          </Button>
        </div>
      )}

      {/* Customization Dialog */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-[90vw] rounded-3xl p-0 overflow-hidden border-none max-h-[85vh] flex flex-col">
          {customizingItem && (
            <>
              <div className="relative h-48 w-full flex-shrink-0">
                <Image src={placeholderImageMap.get(customizingItem.imageId)?.imageUrl || ''} alt={customizingItem.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                   <div className={`h-4 w-4 border-2 mb-2 flex items-center justify-center bg-white rounded-sm ${customizingItem.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                      <div className={`h-2 w-2 rounded-full ${customizingItem.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                   </div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{customizingItem.name}</h2>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white">
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
                        <div key={v.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-[#14532d]/20 transition-all">
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

                {customizingItem.addons && customizingItem.addons.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-[#14532d] uppercase tracking-widest">Extra Toppings</h3>
                    <div className="space-y-3">
                      {customizingItem.addons.map((addon) => (
                        <div key={addon.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-[#14532d]/20 transition-all">
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
              </div>

              <div className="p-6 bg-white border-t flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Item Total</span>
                  <span className="text-2xl font-black text-[#14532d]">₹{currentCustomPrice}</span>
                </div>
                <Button 
                  onClick={handleConfirmCustomization}
                  className="bg-[#14532d] hover:bg-[#0f4023] text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl flex-1 border-none"
                >
                  ADD TO CART
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
