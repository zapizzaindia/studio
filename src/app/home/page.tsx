"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  Search, 
  Pizza, 
  Star, 
  TrendingUp, 
  ChevronRight, 
  Bike, 
  ShoppingBasket, 
  ShoppingBag,
  PlusCircle,
  Ticket,
  Flame,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { City, Category, MenuItem, Outlet, Banner, MenuItemVariation, MenuItemAddon, Coupon } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { OutletSelector } from "@/components/outlet-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
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

  const { data: allCategories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: allMenuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: allBanners, loading: bannersLoading } = useCollection<Banner>('banners');
  const { data: allCoupons, loading: couponsLoading } = useCollection<Coupon>('coupons', { where: ['active', '==', true] });
  
  const categories = useMemo(() => allCategories?.filter(c => c.brand === selectedOutlet?.brand) || [], [allCategories, selectedOutlet]);
  const menuItems = useMemo(() => allMenuItems?.filter(i => i.brand === selectedOutlet?.brand) || [], [allMenuItems, selectedOutlet]);
  const banners = useMemo(() => allBanners?.filter(b => b.brand === selectedOutlet?.brand) || [], [allBanners, selectedOutlet]);
  const coupons = useMemo(() => allCoupons?.filter(c => c.brand === selectedOutlet?.brand) || [], [allCoupons, selectedOutlet]);

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

  // 3-Second Auto Scroll Logic for Banners
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
    const hasOptions = (item.variations?.length || 0) > 0 || (item.addons?.length || 0) > 0;
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

  const availableAddons = useMemo(() => {
    if (!customizingItem) return [];
    if (selectedVariation?.addons && selectedVariation.addons.length > 0) {
      return selectedVariation.addons;
    }
    return customizingItem.addons || [];
  }, [customizingItem, selectedVariation]);

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  if (!isHydrated || userLoading) {
    return <div className="flex justify-center items-center h-screen bg-white"><Skeleton className="h-12 w-12 rounded-full animate-spin" /></div>;
  }

  if (!selectedCity) return <CitySelector onCitySelect={handleCitySelect} />;
  if (!selectedOutlet) return <OutletSelector cityId={selectedCity.id} onOutletSelect={handleOutletSelect} onBack={() => setSelectedCity(null)} />;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f8f9fa] pb-32">
      {/* Welcome Header */}
      <div style={{ backgroundColor: brandColor }} className="text-white px-6 pt-10 pb-16 rounded-b-[40px] shadow-lg relative overflow-hidden transition-all duration-700">
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Welcome Back,</p>
            <h1 className="text-2xl font-black italic tracking-tighter leading-none">
              {user?.displayName?.split(' ')[0] || 'Gourmet'}!
            </h1>
          </div>
          <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/5 h-10 items-stretch">
            <button onClick={() => setOrderType("delivery")} className={`flex items-center gap-1.5 px-3 rounded-lg transition-all duration-300 ${orderType === "delivery" ? 'bg-white text-[#333] shadow-sm' : 'text-white/80'}`}>
              <Bike className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
            </button>
            <button onClick={() => setOrderType("takeaway")} className={`flex items-center gap-1.5 px-3 rounded-lg transition-all duration-300 ${orderType === "takeaway" ? 'bg-white text-[#333] shadow-sm' : 'text-white/80'}`}>
              <ShoppingBasket className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pickup</span>
            </button>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 opacity-5 rotate-[15deg] pointer-events-none">
          {selectedOutlet.brand === 'zapizza' ? <Pizza className="w-40 h-48" /> : <Flame className="w-40 h-48" />}
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 -mt-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
          <Input placeholder={`Search ${selectedOutlet.brand === 'zfry' ? 'Zfry' : 'Zapizza'}...`} className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl font-bold placeholder:font-normal" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Hero Banners */}
      <div className="mt-6 px-6">
        <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {bannersLoading ? (
              <CarouselItem><Skeleton className="w-full h-48 rounded-[32px]" /></CarouselItem>
            ) : banners?.filter(b => b.active).map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full aspect-[21/9] rounded-[32px] overflow-hidden shadow-lg group">
                  <Image src={placeholderImageMap.get(banner.imageId)?.imageUrl || 'https://picsum.photos/seed/banner/800/400'} alt={banner.title || 'Promotion'} fill className="object-cover" />
                  <div style={{ background: `linear-gradient(to right, ${brandColor}E6, ${brandColor}66, transparent)` }} className="absolute inset-0 flex flex-col justify-center p-6">
                    {banner.subtitle && <Badge className="w-fit mb-2 bg-yellow-400 text-black font-black uppercase text-[8px] tracking-widest rounded-sm">{banner.subtitle}</Badge>}
                    {banner.title && <h2 className="text-white text-xl font-black uppercase italic leading-tight mb-2 drop-shadow-md">{banner.title}</h2>}
                    {banner.price && <p className="text-white font-black text-lg">₹{banner.price}</p>}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Categories */}
      <div className="mt-8">
        <div className="px-6 flex justify-between items-center mb-4">
          <h2 className="text-lg font-black uppercase tracking-tighter" style={{ color: brandColor }}>Explore Menu</h2>
          <Button variant="ghost" size="sm" className="text-xs font-black uppercase gap-1 pr-0" style={{ color: brandColor }} onClick={() => router.push('/home/menu')}>See All <ChevronRight className="h-3 w-3" /></Button>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-2">
          {categoriesLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-20 rounded-full flex-shrink-0" />) : categories?.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0" onClick={() => router.push(`/home/menu?category=${cat.id}`)}>
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-current transition-all shadow-md active:scale-95 bg-white">
                <Image src={placeholderImageMap.get(cat.imageId || 'cat_veg')?.imageUrl || ''} alt={cat.name} fill className="object-cover" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-center max-w-[80px] line-clamp-1" style={{ color: brandColor }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Now Section */}
      <div className="mt-8">
        <div className="px-6 flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: brandColor }}>
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Trending Now</h2>
          </div>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-4">
          {menuItemsLoading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-56 w-44 rounded-[32px] flex-shrink-0" />) : menuItems?.slice(0, 5).map((item) => (
            <motion.div key={item.id} whileTap={{ scale: 0.95 }} className="flex flex-col gap-3 w-44 flex-shrink-0 cursor-pointer group bg-white p-2.5 rounded-[32px] border border-gray-100 shadow-sm" onClick={() => handleAddClick(item)}>
              <div className="relative h-40 w-full rounded-[24px] overflow-hidden shadow-sm border border-black/5">
                <Image src={placeholderImageMap.get(item.imageId)?.imageUrl || ''} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute bottom-3 right-3"><div style={{ backgroundColor: brandColor }} className="p-2.5 rounded-2xl shadow-lg ring-4 ring-white/10"><PlusCircle className="h-5 w-5 text-white" /></div></div>
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-white/20">
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-black text-[#333]">4.8</span>
                </div>
              </div>
              <div className="px-2 pb-1 space-y-0.5">
                <h4 className="text-[12px] font-black text-[#333] uppercase leading-tight tracking-tight line-clamp-1">{item.name}</h4>
                <div className="flex items-center gap-1.5"><span className="text-[14px] font-black" style={{ color: brandColor }}>₹{item.price}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Offers Section */}
      {coupons && coupons.length > 0 && (
        <div className="mt-8">
          <div className="px-6 flex justify-center mb-4">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-[#111]">Top Offers</h2>
          </div>
          <div className="flex overflow-x-auto px-6 space-x-4 scrollbar-hide pb-4">
            {coupons.map((coupon) => (
              <div 
                key={coupon.id} 
                className="min-w-[300px] bg-white rounded-[24px] overflow-hidden flex shadow-sm border border-gray-100 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                onClick={() => {
                  navigator.clipboard.writeText(coupon.code);
                  toast({ title: "Code Copied!", description: `Use ${coupon.code} at checkout.` });
                }}
              >
                <div style={{ backgroundColor: brandColor + '10' }} className="w-24 flex flex-col items-center justify-center p-4 relative border-r border-dashed border-gray-200">
                  <div className="text-center">
                    <span className="text-xl font-black block" style={{ color: brandColor }}>
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: brandColor }}>OFF</span>
                  </div>
                  <div className="absolute top-0 right-0 bottom-0 w-2 overflow-hidden flex flex-col justify-around py-1">
                    {Array.from({length: 6}).map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-white rounded-full -mr-2" />
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-center">
                  <h4 className="text-[12px] font-black uppercase tracking-tight text-[#333] leading-tight line-clamp-1">
                    {coupon.description || `GET FLAT ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ''} DISCOUNT`}
                  </h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">
                    Use <span className="text-[#333] font-black tracking-widest">{coupon.code}</span> {coupon.minOrderAmount > 0 ? `| Above ₹${coupon.minOrderAmount}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Sellers Section */}
      <div className="mt-8 mb-8">
        <div className="px-6 flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: brandColor }}>
              <Award className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Best Sellers</h2>
          </div>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-4">
          {menuItemsLoading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-64 w-52 rounded-[32px] flex-shrink-0" />) : menuItems?.slice(2, 7).map((item) => (
            <motion.div 
              key={item.id} 
              whileTap={{ scale: 0.95 }} 
              className="flex flex-col w-52 flex-shrink-0 bg-white rounded-[32px] shadow-md border border-gray-50 overflow-hidden"
              onClick={() => handleAddClick(item)}
            >
              <div className="relative h-36 w-full">
                <Image src={placeholderImageMap.get(item.imageId)?.imageUrl || ''} alt={item.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-[#333]">
                  Most Loved
                </div>
              </div>
              <div className="p-5 flex flex-col gap-2">
                <h4 className="text-[13px] font-black text-[#333] uppercase leading-tight tracking-tight line-clamp-1">{item.name}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed h-8">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-black" style={{ color: brandColor }}>₹{item.price}</span>
                  <div style={{ backgroundColor: brandColor }} className="p-1.5 rounded-full text-white shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-[90vw] rounded-[32px] p-0 overflow-hidden border-none max-h-[85vh] flex flex-col shadow-2xl">
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
              <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white scrollbar-hide">
                {customizingItem.variations && customizingItem.variations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest" style={{ color: brandColor }}>Select Size</h3><Badge variant="secondary" className="text-[9px] uppercase font-black px-2 py-0.5 rounded-sm">Required</Badge></div>
                    <RadioGroup value={selectedVariation?.name} onValueChange={(val) => {
                      const newVar = customizingItem.variations?.find(v => v.name === val) || null;
                      setSelectedVariation(newVar);
                      setSelectedAddons([]); 
                    }} className="space-y-3">
                      {customizingItem.variations.map((v) => (
                        <div key={v.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-current transition-all">
                          <Label htmlFor={`v-${v.name}`} className="flex-1 cursor-pointer"><span className="text-sm font-bold text-[#333] uppercase">{v.name}</span></Label>
                          <div className="flex items-center gap-3"><span className="text-xs font-black" style={{ color: brandColor }}>₹{v.price}</span><RadioGroupItem value={v.name} id={`v-${v.name}`} /></div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Separator />

                {availableAddons.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: brandColor }}>Extra Toppings</h3>
                    <div className="space-y-3">
                      {availableAddons.map((addon) => (
                        <div key={addon.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-current transition-all">
                          <Label htmlFor={`a-${addon.name}`} className="flex-1 cursor-pointer">
                            <span className="text-sm font-bold text-[#333] uppercase">{addon.name}</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black" style={{ color: brandColor }}>₹{addon.price}</span>
                            <Checkbox 
                              id={`a-${addon.name}`} 
                              checked={selectedAddons.some(a => a.name === addon.name)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedAddons([...selectedAddons, addon]);
                                else setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Price</span>
                  <span className="text-2xl font-black" style={{ color: brandColor }}>₹{currentCustomPrice}</span>
                </div>
                <Button onClick={handleConfirmCustomization} style={{ backgroundColor: brandColor }} className="text-white px-10 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex-1 border-none active:scale-95 transition-all">ADD TO CART</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating View Cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button onClick={() => router.push('/home/checkout')} style={{ backgroundColor: brandColor }} className="w-full h-16 text-white flex items-center justify-between px-8 rounded-[24px] shadow-2xl animate-in slide-in-from-bottom-10 border-none transition-all duration-500">
            <div className="flex flex-col items-start"><span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{totalItems} ITEMS</span><span className="text-xl font-black tracking-tight">₹{totalPrice}</span></div>
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[13px]">VIEW CART <ShoppingBag className="h-5 w-5" /></div>
          </Button>
        </div>
      )}
    </div>
  );
}