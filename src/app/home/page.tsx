
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
  Clock,
  Ticket,
  Copy,
  Flame
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { City, Category, MenuItem, Outlet, Banner, MenuItemVariation, MenuItemAddon, Coupon } from "@/lib/types";
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
  type CarouselApi
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();
  const { toast } = useToast();
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">("delivery");
  const [api, setApi] = useState<CarouselApi>();

  // Customization State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<MenuItemVariation | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);

  // Offer Modal State
  const [selectedOffer, setSelectedOffer] = useState<Coupon | null>(null);
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: banners, loading: bannersLoading } = useCollection<Banner>('banners');
  const { data: coupons, loading: couponsLoading } = useCollection<Coupon>('coupons', { where: ['active', '==', true] });
  
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

  // Banner Auto-scroll effect
  useEffect(() => {
    if (!api) return;

    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [api]);

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
    const hasOptions = 
      (item.variations && item.variations.length > 0) || 
      (item.addons && item.addons.length > 0) || 
      (item.recommendedSides && item.recommendedSides.length > 0);

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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied!", description: `${code} is now in your clipboard.` });
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
      {/* Welcome Header */}
      <div className="bg-[#14532d] text-white px-6 pt-10 pb-16 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Welcome Back,</p>
            <h1 className="text-2xl font-black italic tracking-tighter leading-none">
              {user?.displayName?.split(' ')[0] || 'Gourmet'}!
            </h1>
          </div>
          
          <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/5 h-10 items-stretch">
            <button 
              onClick={() => setOrderType("delivery")}
              className={`flex items-center gap-1.5 px-3 rounded-lg transition-all duration-300 ${orderType === "delivery" ? 'bg-white text-[#14532d] shadow-sm' : 'text-white/80'}`}
            >
              <Bike className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
            </button>
            <button 
              onClick={() => setOrderType("takeaway")}
              className={`flex items-center gap-1.5 px-3 rounded-lg transition-all duration-300 ${orderType === "takeaway" ? 'bg-white text-[#14532d] shadow-sm' : 'text-white/80'}`}
            >
              <ShoppingBasket className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pickup</span>
            </button>
          </div>
        </div>
        
        <div className="absolute -top-4 -right-4 opacity-5 rotate-[15deg]">
          <Pizza className="w-40 h-48" />
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 -mt-8">
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
        <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
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

      {/* Explore Menu - Small Scrollable */}
      <div className="mt-10">
        <div className="px-6 flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-[#14532d] uppercase tracking-tighter">Explore Menu</h2>
          <Button variant="ghost" size="sm" className="text-xs font-black uppercase text-[#14532d] gap-1 pr-0" onClick={() => router.push('/home/menu')}>
            See All <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-4">
          {categoriesLoading ? Array.from({length: 6}).map((_, i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-full flex-shrink-0" />
          )) : categories?.map((cat) => (
            <div 
              key={cat.id} 
              className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0"
              onClick={() => router.push(`/home/menu?category=${cat.id}`)}
            >
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#14532d] transition-all shadow-md active:scale-95">
                <Image src={`https://picsum.photos/seed/${cat.id}/300/300`} alt={cat.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
              <span className="text-[10px] font-black text-[#14532d] uppercase tracking-tighter text-center max-w-[80px] line-clamp-1">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      <div className="mt-12">
        <div className="px-6 flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#14532d] p-1.5 rounded-lg shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-black text-[#14532d] uppercase tracking-tighter italic">Trending Now</h2>
          </div>
          <Badge variant="outline" className="text-[9px] border-[#14532d] text-[#14532d] font-black uppercase tracking-[0.1em] px-2 py-0.5">Hot Selling</Badge>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-8">
          {menuItemsLoading ? Array.from({length: 3}).map((_, i) => (
            <Skeleton key={i} className="h-56 w-44 rounded-[28px] flex-shrink-0" />
          )) : menuItems?.slice(0, 5).map((item) => (
            <motion.div 
              key={item.id} 
              whileTap={{ scale: 0.95 }}
              className="flex flex-col gap-3 w-44 flex-shrink-0 cursor-pointer group bg-white p-2.5 rounded-[32px] border border-gray-100 shadow-sm"
              onClick={() => handleAddClick(item)}
            >
              <div className="relative h-40 w-full rounded-[24px] overflow-hidden shadow-sm border border-black/5">
                <Image 
                  src={placeholderImageMap.get(item.imageId)?.imageUrl || ''} 
                  alt={item.name} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                
                {/* Floating Add Button */}
                <div className="absolute bottom-3 right-3">
                  <div className="bg-[#14532d] p-2.5 rounded-2xl shadow-lg ring-4 ring-white/10 group-hover:bg-black transition-colors">
                    <PlusCircle className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Rating Tag */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-white/20">
                  <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                  <span className="text-[10px] font-black text-[#333333]">4.8</span>
                </div>

                {/* Hot Badge Overlay */}
                <div className="absolute top-3 right-3 bg-red-600 text-white p-1 rounded-lg shadow-md">
                   <Flame className="h-3 w-3 fill-current" />
                </div>
              </div>
              
              <div className="px-2 pb-1 space-y-0.5">
                <h4 className="text-[12px] font-black text-[#333333] uppercase leading-tight tracking-tight line-clamp-1">{item.name}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-black text-[#14532d]">₹{item.price}</span>
                  <span className="text-[10px] font-bold text-muted-foreground line-through opacity-40 italic">₹{item.price + 50}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TOP OFFERS */}
      <div className="mt-8">
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="h-5 w-5 text-[#14532d]" />
            <h2 className="text-lg font-black text-[#14532d] uppercase tracking-tighter">Top Offers</h2>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Exciting deals just for you</p>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-4 scrollbar-hide pb-4">
          {couponsLoading ? Array.from({length: 3}).map((_, i) => (
            <Skeleton key={i} className="h-24 w-64 rounded-2xl flex-shrink-0" />
          )) : coupons?.map((coupon) => (
            <div 
              key={coupon.id} 
              onClick={() => setSelectedOffer(coupon)}
              className="relative w-64 flex-shrink-0 bg-white rounded-2xl border-2 border-dashed border-[#14532d]/20 p-4 flex items-center gap-4 group active:scale-95 transition-transform overflow-hidden cursor-pointer"
            >
              <div className="bg-[#14532d]/5 p-3 rounded-xl">
                <Ticket className="h-6 w-6 text-[#14532d]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-[#14532d] uppercase tracking-widest mb-1">Use Code</p>
                <h4 className="text-lg font-black text-[#333333] leading-none mb-1">{coupon.code}</h4>
                <p className="text-[11px] font-bold text-muted-foreground">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`} 
                  {coupon.minOrderAmount > 0 && ` on ₹${coupon.minOrderAmount}+`}
                </p>
              </div>
              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-[#f8f9fa] rounded-full border-r-2 border-dashed border-[#14532d]/20" />
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-[#f8f9fa] rounded-full border-l-2 border-dashed border-[#14532d]/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Bestsellers */}
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

      {/* Offer Details Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        <DialogContent className="max-w-[90vw] rounded-3xl p-6 bg-white border-none shadow-2xl">
          {selectedOffer && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="px-4 py-2 border-2 border-dashed border-[#14532d] rounded-xl bg-[#14532d]/5">
                  <span className="text-xl font-black text-[#14532d] tracking-widest uppercase">{selectedOffer.code}</span>
                </div>
                <button 
                  onClick={() => handleCopyCode(selectedOffer.code)}
                  className="text-xs font-black text-[#14532d] uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                >
                  <Copy className="h-4 w-4" /> COPY
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#333333] uppercase italic leading-tight">
                  {selectedOffer.discountType === 'percentage' ? `${selectedOffer.discountValue}% OFF` : `₹${selectedOffer.discountValue} OFF`} on your order
                </h3>
                {selectedOffer.description ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed uppercase">
                      {selectedOffer.description}
                    </p>
                    <Separator className="bg-gray-100" />
                    <p className="text-[11px] font-medium text-muted-foreground uppercase leading-relaxed">
                      {selectedOffer.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">
                    Valid on all orders above ₹{selectedOffer.minOrderAmount}. Apply this code at checkout to redeem the offer.
                  </p>
                )}
              </div>

              <Button 
                onClick={() => setSelectedOffer(null)}
                className="w-full h-14 bg-[#14532d] hover:bg-[#0f4023] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl border-none"
              >
                GOT IT
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

                {/* Recommended Sides */}
                {customizingItem.recommendedSides && customizingItem.recommendedSides.length > 0 && (
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
