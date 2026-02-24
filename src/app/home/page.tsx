
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Flame,
  Ticket,
  Crown,
  History,
  Info,
  Timer,
  AlertTriangle,
  Trophy,
  ChevronRightCircle,
  MapPin,
  Loader2,
  Wallet,
  Plus,
  Send,
  Building2,
  Phone,
  User as UserIcon,
  IndianRupee,
  Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { City, Category, MenuItem, Outlet, Banner, MenuItemVariation, MenuItemAddon, Coupon, UserProfile } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { OutletSelector } from "@/components/outlet-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useDoc, useCollection, useFirestore } from "@/firebase";
import { getImageUrl } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ZapizzaLogo } from "@/components/icons";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOutletState, setSelectedOutletState] = useState<Outlet | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">("delivery");
  const [api, setApi] = useState<CarouselApi>();
  const [isDetecting, setIsDetecting] = useState(false);

  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<MenuItemVariation | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);

  // Franchise Modal State
  const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryCity, setEnquiryCity] = useState("");
  const [enquiryInvestment, setEnquiryInvestment] = useState("");

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || 'dummy');

  // Real-time subscription to the selected outlet's specific details
  const { data: realTimeOutlet } = useDoc<Outlet>('outlets', selectedOutletState?.id || 'dummy');
  const selectedOutlet = realTimeOutlet || selectedOutletState;

  const { data: allCategories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: allMenuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: allBanners, loading: bannersLoading } = useCollection<Banner>('banners');
  const { data: allCoupons } = useCollection<Coupon>('coupons', { where: ['active', '==', true] });
  
  const categories = useMemo(() => allCategories?.filter(c => c.brand === selectedOutlet?.brand) || [], [allCategories, selectedOutlet]);
  const menuItems = useMemo(() => allMenuItems?.filter(i => i.brand === selectedOutlet?.brand) || [], [allMenuItems, selectedOutlet]);
  const banners = useMemo(() => allBanners?.filter(b => b.brand === selectedOutlet?.brand) || [], [allBanners, selectedOutlet]);
  const heroBanner = useMemo(() => banners.find(b => b.active && b.isHero), [banners]);
  const coupons = useMemo(() => allCoupons?.filter(c => c.brand === selectedOutlet?.brand) || [], [allCoupons, selectedOutlet]);

  const detectAndSetLocation = useCallback(async () => {
    if (!db || !navigator.geolocation) return;

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const citySnap = await getDocs(collection(db, 'cities'));
          const citiesList = citySnap.docs.map(d => ({ id: d.id, ...d.data() } as City));
          
          let nearestCity: City | null = null;
          let minCityDist = Infinity;

          citiesList.forEach(city => {
            if (city.latitude && city.longitude) {
              const d = getDistance(latitude, longitude, city.latitude, city.longitude);
              if (d < minCityDist) {
                minCityDist = d;
                nearestCity = city;
              }
            }
          });

          if (nearestCity) {
            handleCitySelect(nearestCity);
            
            const outletSnap = await getDocs(collection(db, 'outlets'));
            const outletsList = outletSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Outlet))
              .filter(o => o.cityId === (nearestCity as City).id);

            let nearestOutlet: Outlet | null = null;
            let minOutletDist = Infinity;

            outletsList.forEach(outlet => {
              if (outlet.latitude && outlet.longitude) {
                const d = getDistance(latitude, longitude, outlet.latitude, outlet.longitude);
                if (d < minOutletDist) {
                  minOutletDist = d;
                  nearestOutlet = outlet;
                }
              }
            });

            if (nearestOutlet) {
              handleOutletSelect(nearestOutlet);
              toast({ title: "Location Detected", description: `Welcome to ${nearestOutlet.name}!` });
            }
          }
        } catch (e) {
          console.error("Auto-location failed", e);
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [db, toast]);

  useEffect(() => {
    setIsHydrated(true);
    const savedCity = localStorage.getItem("zapizza-city");
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    
    if (savedCity && savedOutlet) {
        try { 
          setSelectedCity(JSON.parse(savedCity)); 
          setSelectedOutletState(JSON.parse(savedOutlet));
        } catch(e) {
          detectAndSetLocation();
        }
    } else {
      detectAndSetLocation();
    }
  }, [detectAndSetLocation]);

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
    setSelectedOutletState(null);
    localStorage.removeItem("zapizza-outlet");
  };

  const handleOutletSelect = (outlet: Outlet) => {
    setSelectedOutletState(outlet);
    localStorage.setItem("zapizza-outlet", JSON.stringify(outlet));
  };

  const handleAddClick = (item: MenuItem) => {
    const hasOptions = (item.variations?.length || 0) > 0 || (item.addons?.length || 0) > 0;
    if (hasOptions) {
      setCustomizingItem(item);
      const initialVar = item.variations?.[0] || null;
      setSelectedVariation(initialVar);
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

  const handleFranchiseEnquiry = async () => {
    if (!db) return;
    if (!enquiryName || !enquiryPhone || !enquiryCity || !enquiryInvestment) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all fields to proceed.' });
      return;
    }

    setIsSubmittingEnquiry(true);
    try {
      await addDoc(collection(db, 'franchiseEnquiries'), {
        name: enquiryName,
        phone: enquiryPhone,
        city: enquiryCity,
        investment: enquiryInvestment,
        createdAt: serverTimestamp()
      });
      toast({ title: 'Application Submitted!', description: 'Our franchise team will contact you shortly.' });
      setIsFranchiseModalOpen(false);
      // Reset form
      setEnquiryName(""); setEnquiryPhone(""); setEnquiryCity(""); setEnquiryInvestment("");
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission Error', description: e.message });
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const getPriceDisplay = (item: MenuItem) => {
    const hasVariations = item.variations && item.variations.length > 0;
    const prices = hasVariations ? item.variations!.map(v => v.price) : [item.price];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (hasVariations && minPrice !== maxPrice) {
      return `₹${minPrice} - ₹${maxPrice}`;
    }
    return `₹${minPrice}`;
  };

  const currentCustomPrice = useMemo(() => {
    if (!customizingItem) return 0;
    const base = selectedVariation ? selectedVariation.price : customizingItem.price;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return base + addonsTotal;
  }, [customizingItem, selectedVariation, selectedAddons]);

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  if (!isHydrated || userLoading || isDetecting) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ZapizzaLogo className="h-16 w-16 text-primary" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Identifying Nearest Outlet
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCity) return <CitySelector onCitySelect={handleCitySelect} />;
  if (!selectedOutlet) return <OutletSelector cityId={selectedCity.id} onOutletSelect={handleOutletSelect} onBack={() => setSelectedCity(null)} />;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f8f9fa] pb-32">
  
      {/* 🟢 BRAND HEADER SECTION */}
      <div
        style={{ backgroundColor: brandColor }}
        className="text-white px-6 pt-6 pb-10 relative transition-all duration-700"
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <p className="text-white/80 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">
              Welcome Back,
            </p>
  
            <h1 className="text-2xl font-black italic tracking-tighter leading-none mb-3">
              {userProfile?.displayName?.split(" ")[0] ||
                user?.displayName?.split(" ")[0] ||
                "Gourmet"}
              !
            </h1>
  
            <motion.div
              key={userProfile?.loyaltyPoints}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/home/rewards")}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit cursor-pointer transition-all"
            >
              <Wallet className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">
                {profileLoading ? "..." : userProfile?.loyaltyPoints || 0} LP
                COINS
              </span>
              <ChevronRight className="h-2.5 w-2.5 opacity-50" />
            </motion.div>
          </div>
  
          {/* DELIVERY / PICKUP TOGGLE */}
          <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/5 h-10 items-stretch">
            <button
              onClick={() => setOrderType("delivery")}
              className={`flex items-center gap-1.5 px-3 rounded-lg transition-all duration-300 ${
                orderType === "delivery"
                  ? "bg-white text-[#333] shadow-sm"
                  : "text-white/80"
              }`}
            >
              <Bike className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Delivery
              </span>
            </button>
  
            <button
              onClick={() => setOrderType("takeaway")}
              className={`flex items-center gap-1.5 px-3 rounded-lg transition-all duration-300 ${
                orderType === "takeaway"
                  ? "bg-white text-[#333] shadow-sm"
                  : "text-white/80"
              }`}
            >
              <ShoppingBasket className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Pickup
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* 🔥 MOBILE HERO BANNER */}
      {heroBanner && (
        <div className="block md:hidden relative w-full h-[300px] overflow-hidden">
          {heroBanner.mediaType === "video" ? (
            <video
              src={heroBanner.imageId}
              className="w-full h-full object-cover scale-105"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={getImageUrl(heroBanner.imageId)}
              alt="Hero Banner"
              fill
              priority
              className="object-cover scale-105"
            />
          )}
        </div>
      )}
  
      <div className="mt-6 px-6">
        <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {bannersLoading ? (
              <CarouselItem><Skeleton className="w-full h-48 rounded-[32px]" /></CarouselItem>
            ) : banners?.filter(b => b.active && !b.isHero).map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full aspect-[21/9] rounded-[32px] overflow-hidden shadow-lg group">
                  <Image src={getImageUrl(banner.imageId)} alt={banner.title || 'Promotion'} fill className="object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-center p-6">
                    {banner.subtitle && <Badge className="w-fit mb-2 bg-yellow-400 text-black font-black uppercase text-[8px] tracking-widest rounded-sm">{banner.subtitle}</Badge>}
                    {banner.title && <h2 className="text-white text-xl font-black uppercase italic leading-tight mb-2 drop-shadow-md">{banner.title}</h2>}
                    {banner.price && <p className="text-white font-black text-lg drop-shadow-md">₹{banner.price}</p>}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="mt-4">
        <div className="px-6 flex justify-between items-center mb-3">
          <h2 className="text-lg font-black uppercase tracking-tighter" style={{ color: brandColor }}>Explore Menu</h2>
          <Button variant="ghost" size="sm" className="text-xs font-black uppercase gap-1 pr-0" style={{ color: brandColor }} onClick={() => router.push('/home/menu')}>See All <ChevronRight className="h-3 w-3" /></Button>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-2">
          {categoriesLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-20 rounded-full flex-shrink-0" />) : categories?.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0" onClick={() => router.push(`/home/menu?category=${cat.id}`)}>
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-current transition-all shadow-md active:scale-95 bg-white">
                <Image src={getImageUrl(cat.imageId || 'cat_veg')} alt={cat.name} fill className="object-cover" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-center max-w-[80px] line-clamp-1" style={{ color: brandColor }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="px-6 flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: brandColor }}>
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Trending Now</h2>
          </div>
        </div>
        <div className="flex overflow-x-auto px-6 space-x-6 scrollbar-hide pb-6">
          {menuItemsLoading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-64 w-48 rounded-[32px] flex-shrink-0" />) : menuItems?.slice(0, 5).map((item) => (
            <motion.div 
              key={item.id} 
              whileTap={{ scale: 0.96 }} 
              className="flex flex-col w-48 flex-shrink-0 cursor-pointer group bg-white p-2.5 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1" 
              onClick={() => handleAddClick(item)}
            >
              <div className="relative h-44 w-full rounded-[24px] overflow-hidden shadow-sm border border-black/5">
                <Image src={getImageUrl(item.imageId)} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                
                {/* 📍 Item Indicators */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-white/20">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-black text-[#333]">4.8</span>
                  </div>
                  <Badge className="bg-green-100/90 text-green-800 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg border-none shadow-sm backdrop-blur-sm">Bestseller</Badge>
                </div>

                <div className="absolute bottom-3 right-3">
                  <div style={{ backgroundColor: brandColor }} className="p-3 rounded-2xl shadow-xl ring-4 ring-white/20 group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-white stroke-[3px]" />
                  </div>
                </div>
              </div>

              <div className="px-3 pt-3 pb-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-black text-[#333] uppercase leading-tight tracking-tight line-clamp-1 italic">{item.name}</h4>
                  <div className={cn("h-3 w-3 border flex items-center justify-center rounded-sm flex-shrink-0", item.isVeg ? 'border-green-600' : 'border-red-600')}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", item.isVeg ? 'bg-green-600' : 'bg-red-600')} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[15px] font-black tracking-tight" style={{ color: brandColor }}>{getPriceDisplay(item)}</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Customizable</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🎟️ OFFERS FOR YOU SECTION */}
      {coupons.length > 0 && (
        <div className="mt-8 mb-4">
          <div className="px-6 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: brandColor }}>
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter italic font-headline" style={{ color: brandColor }}>Offers for you</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 scrollbar-hide pb-4">
            {coupons.map((coupon, idx) => {
              const bgColors = [
                'bg-[#008060]', // Deep Teal
                'bg-[#1a73e8]', // Royal Blue
                'bg-[#d93025]', // Google Red
                'bg-[#f9ab00]'  // Amber
              ];
              const bgColor = bgColors[idx % bgColors.length];

              return (
                <div 
                  key={coupon.id} 
                  className={cn(
                    "flex-shrink-0 w-[260px] h-[100px] p-4 rounded-[16px] text-white flex items-center justify-between shadow-sm border border-black/5 transition-transform active:scale-[0.98]",
                    bgColor
                  )}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-1.5 mb-1">
                       <h3 className="text-[15px] font-black uppercase tracking-tight leading-none truncate max-w-[140px]">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                       </h3>
                    </div>
                    <p className="text-[10px] font-bold text-white/90 uppercase line-clamp-2 leading-tight opacity-90">
                      {coupon.maxDiscountAmount ? `Max Saving ₹${coupon.maxDiscountAmount}` : (coupon.description || `On orders above ₹${coupon.minOrderAmount}`)}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => router.push('/home/offers')}
                    className="flex-shrink-0 border-2 border-white/40 h-12 w-16 rounded-xl flex items-center justify-center font-black uppercase text-xs hover:bg-white/10 transition-all shadow-sm"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 px-6 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: brandColor }}>
            <Pizza className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Explore Items</h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {menuItemsLoading ? Array.from({length: 3}).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[32px]" />
          )) : menuItems?.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[24px] p-4 shadow-md border border-gray-50 flex gap-4"
            >
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 border flex items-center justify-center rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                      <div className={`h-1 w-1 rounded-full ${item.isVeg ? 'bg-green-600' : 'border-red-600'}`} />
                    </div>
                    <div className="flex gap-1">
                      <Badge className="bg-green-100 text-green-800 text-[7px] font-black uppercase px-1.5 py-0 rounded-sm border-none">Bestseller</Badge>
                      <Badge className="bg-orange-100 text-orange-800 text-[7px] font-black uppercase px-1.5 py-0 rounded-sm border-none">New</Badge>
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-[#333] uppercase leading-tight tracking-tight">{item.name}</h3>
                  <p className="text-sm font-black" style={{ color: brandColor }}>{getPriceDisplay(item)}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} className={`h-2.5 w-2.5 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                    {item.description} <span className="text-gray-400 font-bold">Read More</span>
                  </p>
                </div>
              </div>
              <div className="relative flex-shrink-0 flex flex-col items-center">
                <div className="relative h-28 w-28 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <Image src={getImageUrl(item.imageId)} alt={item.name} fill className="object-cover" />
                </div>
                <div className="absolute -bottom-2 w-20">
                  <Button 
                    onClick={() => handleAddClick(item)}
                    className="w-full bg-white hover:bg-gray-50 text-[#333] border border-gray-200 h-8 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-1"
                  >
                    Add <span className="text-lg font-normal" style={{ color: brandColor }}>+</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 relative overflow-hidden">
        <div 
          className="w-full px-6 py-12 text-center text-white relative bg-[#111827]"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)]" />
          
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-black uppercase leading-tight px-4 drop-shadow-sm">
              Place Orders Worth Rs.1000 to Upgrade Your Account to ACE Level
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">
              Get LP Coins on Every Order
            </p>
          </div>

          <div className="mt-8 px-2 relative z-10">
            <Card className="bg-white rounded-[24px] border-none shadow-2xl overflow-hidden">
              <CardContent className="p-6 text-left">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-black text-[#333] leading-none tabular-nums">
                    {profileLoading ? "..." : (userProfile?.loyaltyPoints || 0)} LP Coins
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-black uppercase tracking-tight">
                      10% of the Subtotal Value can be paid using the LP ...
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-2xl border border-gray-100 mt-6 overflow-hidden">
                  <div className="bg-gray-50/50 p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-lg font-black text-[#333] tabular-nums">
                      {profileLoading ? "..." : (userProfile?.loyaltyPoints || 0)}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Coins</span>
                  </div>
                  <div className="bg-gray-50/50 p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-lg font-black text-[#333] tabular-nums">0</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Coins Used</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-[#333] uppercase">1 LP Coin = ₹1</span>
                  </div>
                  <Button variant="link" onClick={() => router.push('/home/rewards')} className="p-0 h-auto font-black text-xs uppercase tracking-widest underline decoration-2 underline-offset-4" style={{ color: brandColor }}>
                    Rewards Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-12 px-6">
        <h2 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">
          ENQUIRE ABOUT {selectedOutlet?.brand?.toUpperCase() || 'ZAPIZZA'} FRANCHISE
        </h2>
        <div 
          style={{ backgroundColor: '#f97316' }} 
          className="rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase leading-tight italic">
              {selectedOutlet?.brand === 'zfry' ? 'Zfry' : 'Zapizza'} 700+
            </h3>
            <p className="text-sm font-bold uppercase tracking-widest opacity-80 mt-1">Outlets across the World</p>
            
            <Button 
              onClick={() => setIsFranchiseModalOpen(true)}
              className="mt-8 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest"
            >
              Enquire about Franchise
            </Button>
          </div>
          
          <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-48 h-48 opacity-10 rotate-12 pointer-events-none">
             {selectedOutlet?.brand === 'zfry' ? <Flame className="w-full h-full" /> : <Pizza className="w-full h-full" />}
          </div>
        </div>
      </div>

      {/* 📍 REAL-TIME SELECTED OUTLET CARD */}
      <div className="mt-8 px-6">
        <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full border-2 border-gray-100 flex items-center justify-center p-2 bg-[#f8f9fa]">
               <ZapizzaLogo className="w-full h-full" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-[#333] uppercase">{selectedOutlet?.name || 'Zapizza Outlet'}</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5" /> {selectedOutlet?.address || 'Location Not Specified'}
              </p>
              <button 
                onClick={() => router.push(`/home/reviews/${selectedOutlet?.id}`)}
                className="text-[9px] font-black uppercase mt-1 flex items-center gap-1" 
                style={{ color: brandColor }}
              >
                View Store Reviews <ChevronRightCircle className="h-2.5 w-2.5" />
              </button>
            </div>
            <div 
              onClick={() => router.push(`/home/reviews/${selectedOutlet?.id}`)}
              className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex flex-col items-center gap-0.5 min-w-[60px] cursor-pointer active:scale-95 transition-all"
            >
               <div className="flex items-center gap-1 text-white px-1.5 py-0.5 rounded-lg shadow-sm" style={{ backgroundColor: brandColor }}>
                  <span className="text-[10px] font-black">{selectedOutlet?.rating?.toFixed(1) || "4.5"}</span>
                  <Star className="h-2 w-2 fill-current" />
               </div>
               <span className="text-[8px] font-black text-muted-foreground uppercase">{selectedOutlet?.reviewCount || "0"} Reviews</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 px-6">
        <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-white relative">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-2 max-w-[200px]">
              <h2 className="text-3xl font-black text-[#14532d] uppercase italic tracking-tighter">Beware!</h2>
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase">
                {selectedOutlet?.brand === 'zfry' ? 'Zfry' : 'Zapizza'} or its employees Do not call for any transaction OTP
              </p>
            </div>
            <div className="h-20 w-20 bg-yellow-400/10 rounded-full flex items-center justify-center">
               <AlertTriangle className="h-12 w-12 text-yellow-500" strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">
          AWARDS AND MEDIA
        </h2>
        <div className="flex gap-4 overflow-x-auto px-6 scrollbar-hide pb-4">
          {[
            { title: "Times Food Awards", desc: "Awarded 4 Times in a Row For Our Quality services", bg: "#e3f2fd" },
            { title: "Zomato Quality Choice", desc: "Highest Rated Pizza brand in Rudrapur for 2024", bg: "#fff3e0" }
          ].map((award, i) => (
            <div 
              key={i} 
              style={{ backgroundColor: award.bg }}
              className="flex-shrink-0 w-[300px] rounded-[32px] p-8 flex items-center justify-between shadow-sm border border-black/5"
            >
              <div className="space-y-3">
                <h3 className="text-xl font-black uppercase italic leading-tight text-[#333]">{award.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">{award.desc}</p>
              </div>
              <div className="relative h-20 w-20 flex-shrink-0">
                <Trophy className="h-full w-full text-yellow-500 drop-shadow-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 px-10 text-center space-y-6 pb-12">
        <p className="text-muted-foreground font-medium italic text-lg leading-relaxed opacity-60">
          "The secret of success in life is to eat what you like and let the food fight it out inside." - Mark Twain
        </p>
        <div className="flex items-center justify-center gap-4">
           <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-muted-foreground/30" />
           <div className="text-muted-foreground/30 flex gap-1">
              {Array.from({length: 3}).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-current" />
              ))}
           </div>
           <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-muted-foreground/30" />
        </div>
      </div>

      {/* 🚀 FRANCHISE ENQUIRY MODAL */}
      <Dialog open={isFranchiseModalOpen} onOpenChange={setIsFranchiseModalOpen}>
        <DialogContent className="max-w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="bg-[#f97316] p-8 text-white">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Partnership Program</p>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">Global Network</DialogTitle>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <DialogDescription className="text-white/70 text-xs font-bold uppercase tracking-widest mt-4">
                Join the fastest growing gourmet mesh.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Contact Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={enquiryName}
                    onChange={e => setEnquiryName(e.target.value)}
                    placeholder="Enter your full name" 
                    className="pl-12 h-12 rounded-xl font-bold bg-gray-50 border-gray-100" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Phone Line</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={enquiryPhone}
                    onChange={e => setEnquiryPhone(e.target.value)}
                    placeholder="+91 XXXX XXX XXX" 
                    className="pl-12 h-12 rounded-xl font-bold bg-gray-50 border-gray-100" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Proposed City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={enquiryCity}
                      onChange={e => setEnquiryCity(e.target.value)}
                      placeholder="e.g. Noida" 
                      className="pl-12 h-12 rounded-xl font-bold bg-gray-50 border-gray-100" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Investment Band</Label>
                  <Select value={enquiryInvestment} onValueChange={setEnquiryInvestment}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-gray-50 border-gray-100">
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15-25L">₹15L - ₹25L</SelectItem>
                      <SelectItem value="25-50L">₹25L - ₹50L</SelectItem>
                      <SelectItem value="50L+">₹50L+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-[#f97316] mt-0.5" />
              <p className="text-[9px] font-bold text-orange-800 uppercase leading-relaxed">
                By submitting, you agree to allow our franchise development team to contact you via phone or email for a detailed consultation.
              </p>
            </div>
          </div>

          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsFranchiseModalOpen(false)}
              className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFranchiseEnquiry}
              disabled={isSubmittingEnquiry}
              className="flex-[2] h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-200"
            >
              {isSubmittingEnquiry ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  Submit Interest <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customization Dialog */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-[90vw] rounded-[32px] p-0 overflow-hidden border-none max-h-[85vh] flex flex-col shadow-2xl">
          {customizingItem && (
            <>
              <div className="relative h-48 w-full flex-shrink-0">
                <Image src={getImageUrl(customizingItem.imageId)} alt={customizingItem.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                   <div className={`h-4 w-4 border-2 mb-2 flex items-center justify-center bg-white rounded-sm ${customizingItem.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                      <div className={`h-2 w-2 rounded-full ${customizingItem.isVeg ? 'bg-green-600' : 'border-red-600'}`} />
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
