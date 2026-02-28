
"use client";



import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  ShoppingBag, 
  List, 
  X, 
  Search, 
  Info, 
  Clock, 
  MapPin, 
  Star, 
  SlidersHorizontal, 
  Leaf, 
  Flame, 
  Zap,
  ChevronDown,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { Category, MenuItem, MenuItemVariation, MenuItemAddon, Outlet, Coupon } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection, useDoc } from "@/firebase";
import { getImageUrl } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  
  const [savedOutletId, setSavedOutletId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [showInStockOnly, setShowInStockOnly] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("zapizza-outlet");
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setSavedOutletId(parsed.id);
      } catch(e) {}
    }
  }, []);

  // Real-time subscription to the selected outlet
  const { data: selectedOutlet, loading: outletLoading } = useDoc<Outlet>('outlets', savedOutletId || 'dummy');

  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories', {
    where: selectedOutlet ? ['brand', '==', selectedOutlet.brand] : undefined
  });
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems', {
    where: selectedOutlet ? ['brand', '==', selectedOutlet.brand] : undefined
  });
  const { data: coupons } = useCollection<Coupon>('coupons', {
    where: selectedOutlet ? ['brand', '==', selectedOutlet.brand] : undefined
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Customization State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<MenuItemVariation | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);

  useEffect(() => {
    if (initialCategory && !categoriesLoading) {
        const el = document.getElementById(`cat-${initialCategory}`);
        if (el) {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }
  }, [initialCategory, categoriesLoading]);

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
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

  const handleLocationChange = () => {
    localStorage.removeItem("zapizza-city");
    localStorage.removeItem("zapizza-outlet");
    router.push('/home');
  };

  const availableAddons = useMemo(() => {
    if (!customizingItem) return [];
    if (customizingItem.variations && customizingItem.variations.length > 0) {
      return selectedVariation?.addons || [];
    }
    return customizingItem.addons || [];
  }, [customizingItem, selectedVariation]);

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    let items = menuItems;

    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === "veg") items = items.filter(i => i.isVeg);
    if (activeFilter === "non-veg") items = items.filter(i => !i.isVeg);
    if (showInStockOnly) items = items.filter(i => i.isAvailable !== false);

    return items;
  }, [menuItems, searchQuery, activeFilter, showInStockOnly]);

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
  const topCoupon = coupons?.find(c => c.active);

  if (outletLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white relative">
      {/* 1. Header with Real-Time Outlet Info */}
      <div className="bg-white px-4 pt-4 pb-2 border-b">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#333] uppercase italic flex items-center gap-1.5 font-headline">
                {selectedOutlet?.name || "Zapizza"} <Info className="h-4 w-4 text-muted-foreground" />
              </h1>
              <Badge 
                className={cn(
                  "border-none font-black text-[8px] uppercase px-1.5 h-4 font-headline",
                  selectedOutlet?.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}
              >
                {selectedOutlet?.isOpen ? "OPEN" : "CLOSED"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5 text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[11px] font-bold font-body tabular-nums">
                  <Clock className="h-3 w-3" /> {selectedOutlet?.deliveryTime || "35-45 Mins"}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold font-body tabular-nums">
                  <Clock className="h-3 w-3 opacity-50" /> {selectedOutlet?.openingTime} - {selectedOutlet?.closingTime}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold cursor-pointer hover:text-foreground transition-colors pr-4 font-headline" onClick={handleLocationChange}>
                <MapPin className="h-3 w-3 flex-shrink-0" /> 
                <span className="truncate">{selectedOutlet?.address || "Selecting Location..."}</span> 
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 border rounded-lg p-1.5 min-w-[65px] bg-gray-50/50">
            <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm font-body tabular-nums">
              {selectedOutlet?.rating?.toFixed(2) || "4.50"} <Star className="h-2 w-2 fill-current" />
            </div>
            <span className="text-[8px] font-bold text-muted-foreground uppercase text-center leading-tight font-headline">
              <span className="font-body tabular-nums">{selectedOutlet?.reviewCount || "88"}</span><br/>Reviews
            </span>
          </div>
        </div>
      </div>

      {/* 2. Offers Banner */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between cursor-pointer group" onClick={() => router.push('/home/offers')}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg transition-transform group-hover:scale-110" style={{ backgroundColor: brandColor }}>
            <Zap className="h-4 w-4 text-white fill-current" />
          </div>
          <div className="flex flex-col">
            <p className="text-[11px] font-black uppercase text-[#333] tracking-tight font-headline">
              {topCoupon ? `Get Flat Discount of ₹${topCoupon.discountValue}...` : "Exclusive Offers Available"}
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase font-headline">
              Use Code <span className="text-[#333] font-headline">{topCoupon?.code || "WELCOME"}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase font-headline">
          <span className="font-body tabular-nums">{coupons?.length || 0}</span> OFFERS <ChevronDown className="h-3 w-3" />
        </div>
      </div>

      {/* 3. Filters Sticky Row */}
      <div className="sticky top-16 z-30 bg-white border-b overflow-x-auto px-4 py-3 flex items-center gap-3 scrollbar-hide">
        <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 text-[10px] font-black uppercase gap-2 flex-shrink-0 font-headline">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowInStockOnly(!showInStockOnly)}
          className={cn(
            "h-9 px-4 rounded-xl text-[10px] font-black uppercase gap-2 flex-shrink-0 transition-all font-headline",
            showInStockOnly ? "border-primary bg-primary/5 text-primary" : "border-gray-200"
          )}
        >
          <Zap className={cn("h-3.5 w-3.5", showInStockOnly ? "fill-current" : "")} /> In Stock
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setActiveFilter(activeFilter === "veg" ? "all" : "veg")}
          className={cn(
            "h-9 px-4 rounded-xl text-[10px] font-black uppercase gap-2 flex-shrink-0 transition-all font-headline",
            activeFilter === "veg" ? "border-green-600 bg-green-50 text-green-600" : "border-gray-200"
          )}
        >
          <Leaf className={cn("h-3.5 w-3.5", activeFilter === "veg" ? "fill-current" : "")} /> Veg
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setActiveFilter(activeFilter === "non-veg" ? "all" : "non-veg")}
          className={cn(
            "h-9 px-4 rounded-xl text-[10px] font-black uppercase gap-2 flex-shrink-0 transition-all font-headline",
            activeFilter === "non-veg" ? "border-red-600 bg-red-50 text-red-600" : "border-gray-200"
          )}
        >
          <Flame className={cn("h-3.5 w-3.5", activeFilter === "non-veg" ? "fill-current" : "")} /> Non-Veg
        </Button>
      </div>

      <div className="flex-1 pb-32">
        {/* 4. Featured Items (Horizontal Carousel) */}
        {!searchQuery && menuItems && (
          <div className="py-8 border-b">
            <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] mb-6 text-[#333] font-headline">Featured Items</h2>
            <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">
              {menuItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex-shrink-0 w-48 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group active:scale-95 transition-transform cursor-pointer font-headline" onClick={() => handleAddClick(item)}>
                  <div className="relative h-44 w-full">
                    <Image src={getImageUrl(item.imageId)} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 border flex items-center justify-center rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'border-red-600'}`} />
                      </div>
                      <div className="flex gap-1">
                        <Badge className="bg-green-100 text-green-800 text-[7px] font-black uppercase px-1 py-0 rounded-sm border-none">Bestseller</Badge>
                        <Badge className="bg-orange-100 text-orange-800 text-[7px] font-black uppercase px-1 py-0 rounded-sm border-none">New</Badge>
                      </div>
                    </div>
                    <h4 className="text-[12px] font-black text-[#333] uppercase leading-tight mt-1">{item.name}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Customisable</p>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-[13px] font-black text-[#333] font-body tabular-nums">{getPriceDisplay(item)}</span>
                      <Button variant="outline" className="h-8 px-4 rounded-lg border-gray-200 text-[10px] font-black uppercase bg-white hover:bg-gray-50 text-[#333] shadow-sm">
                        Add <Plus className="h-3 w-3 ml-1" style={{ color: brandColor }} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Main Menu List */}
        <div className="flex flex-col">
          {categoriesLoading || menuItemsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 space-y-4">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ))
          ) : categories?.map((category) => {
            const categoryItems = filteredMenuItems.filter(i => i.category === category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-36">
                <div className="px-6 py-8">
                  <h3 className="text-lg font-black text-[#333] uppercase italic leading-none text-center font-headline">
                    {category.name}
                  </h3>
                  <div className="h-0.5 w-12 bg-[#333] mx-auto mt-2" />
                </div>
                <div className="space-y-px bg-gray-100">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="bg-white px-6 py-8 flex gap-6 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer" onClick={() => handleAddClick(item)}>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-3.5 w-3.5 border-2 flex items-center justify-center rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'border-red-600'}`} />
                          </div>
                        </div>
                        <h4 className="text-[15px] font-black text-[#333] uppercase leading-tight tracking-tight mb-1 font-headline">{item.name}</h4>
                        <p className="text-[14px] font-black text-[#333] mb-2 font-body tabular-nums">{getPriceDisplay(item)}</p>
                        <p className="text-[11px] text-muted-foreground font-medium line-clamp-2 leading-relaxed font-body">
                          {item.description} <span className="text-gray-400 font-bold font-headline">Read More</span>
                        </p>
                      </div>
                      <div className="relative flex-shrink-0 flex flex-col items-center">
                        <div className="relative h-28 w-28 rounded-2xl overflow-hidden shadow-md border border-gray-100">
                          <Image src={getImageUrl(item.imageId)} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="absolute -bottom-2 w-20">
                          <Button className="w-full bg-white hover:bg-gray-50 text-[#333] border border-gray-200 h-8 rounded-lg font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-1 font-headline">
                            Add <span className="text-lg font-normal font-body" style={{ color: brandColor }}>+</span>
                          </Button>
                          <p className="text-center text-[8px] font-black text-muted-foreground uppercase mt-3 font-headline">Customisable</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[51] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="fixed bottom-36 left-4 right-4 bg-white rounded-2xl z-[52] shadow-2xl p-6 overflow-hidden border border-gray-100"
            >
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 font-headline" style={{ color: brandColor }}>Choose Category</h3>
              <div className="grid grid-cols-1 gap-1">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className="flex items-center justify-between w-full py-3 px-4 rounded-xl hover:bg-[#f1f2f6] transition-colors text-left group font-headline"
                  >
                    <span className="text-sm font-bold text-[#333] group-hover:text-primary">{cat.name}</span>
                    <span className="text-[10px] font-black text-muted-foreground opacity-50 font-body tabular-nums">
                      {menuItems?.filter(i => i.category === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-36 right-6 z-50">
        <Button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-[#333333] hover:bg-black text-white h-12 w-12 rounded-full shadow-2xl flex items-center justify-center p-0"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
        </Button>
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button 
            onClick={() => router.push('/home/checkout')}
            style={{ backgroundColor: brandColor }}
            className="w-full h-16 text-white flex items-center justify-between px-8 rounded-[24px] shadow-2xl animate-in slide-in-from-bottom-10 font-headline"
          >
            <div className="flex flex-col items-start font-body tabular-nums">
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{totalItems} ITEMS</span>
              <span className="text-xl font-black">₹{totalPrice}</span>
            </div>
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[13px]">
              VIEW CART <ShoppingBag className="h-5 w-5" />
            </div>
          </Button>
        </div>
      )}

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
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic font-headline">{customizingItem.name}</h2>
                </div>
              </div>
              <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white scrollbar-hide">
                {customizingItem.variations && customizingItem.variations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest font-headline" style={{ color: brandColor }}>Select Size</h3><Badge variant="secondary" className="text-[9px] uppercase font-black px-2 py-0.5 rounded-sm font-headline">Required</Badge></div>
                    <RadioGroup value={selectedVariation?.name} onValueChange={(val) => {
                      const newVar = customizingItem.variations?.find(v => v.name === val) || null;
                      setSelectedVariation(newVar);
                      setSelectedAddons([]); 
                    }} className="space-y-3">
                      {customizingItem.variations.map((v) => (
                        <div key={v.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-current transition-all">
                          <Label htmlFor={`v-${v.name}`} className="flex-1 cursor-pointer"><span className="text-sm font-bold text-[#333] uppercase font-headline">{v.name}</span></Label>
                          <div className="flex items-center gap-3"><span className="text-xs font-black font-body tabular-nums" style={{ color: brandColor }}>₹{v.price}</span><RadioGroupItem value={v.name} id={`v-${v.name}`} /></div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
                <Separator />
                {availableAddons.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest font-headline" style={{ color: brandColor }}>Extra Toppings</h3>
                    <div className="space-y-3">
                      {availableAddons.map((addon) => (
                        <div key={addon.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-current transition-all">
                          <Label htmlFor={`a-${addon.name}`} className="flex-1 cursor-pointer">
                            <span className="text-sm font-bold text-[#333] uppercase font-headline">{addon.name}</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black font-body tabular-nums" style={{ color: brandColor }}>₹{addon.price}</span>
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
              <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between gap-4 font-headline">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Price</span>
                  <span className="text-2xl font-black font-body tabular-nums" style={{ color: brandColor }}>₹{currentCustomPrice}</span>
                </div>
                <Button onClick={handleConfirmCustomization} style={{ backgroundColor: brandColor }} className="text-white px-10 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex-1 border-none active:scale-95 transition-all">ADD TO CART</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
