
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/firebase";
import type { Coupon, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function OffersPage() {
  const router = useRouter();
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    if (savedOutlet) {
      try { setSelectedOutlet(JSON.parse(savedOutlet)); } catch(e) {}
    }
  }, []);

  const { data: allCoupons, loading } = useCollection<Coupon>('coupons', { 
    where: ['active', '==', true] 
  });

  const coupons = useMemo(() => {
    const brandCoupons = allCoupons?.filter(c => c.brand === selectedOutlet?.brand) || [];
    if (!searchQuery) return brandCoupons;
    return brandCoupons.filter(c => 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allCoupons, selectedOutlet, searchQuery]);

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-black uppercase tracking-widest" style={{ color: brandColor }}>Available Offers</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search coupons..." 
            className="pl-10 h-10 bg-gray-50 border-none font-bold text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 space-y-4 container max-w-lg mx-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))
        ) : coupons.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-black uppercase italic" style={{ color: brandColor }}>No offers found</h3>
            <p className="text-muted-foreground">Keep an eye out for upcoming deals!</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div 
              key={coupon.id} 
              className="bg-white rounded-2xl shadow-md border border-gray-100 flex overflow-hidden group active:scale-[0.98] transition-transform h-28"
            >
              {/* Left Part - Value */}
              <div 
                style={{ backgroundColor: brandColor + '08' }} 
                className="w-24 flex flex-col items-center justify-center relative border-r border-dashed"
              >
                {/* Scalloped notches between sections */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f1f2f6] rounded-full" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#f1f2f6] rounded-full" />
                
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black leading-none" style={{ color: brandColor }}>
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80" style={{ color: brandColor }}>OFF</span>
                </div>
              </div>
              
              {/* Right Part - Info */}
              <div className="flex-1 p-4 flex flex-col justify-center bg-white">
                <div className="flex justify-between items-start mb-1">
                  <Badge variant="outline" className="font-black text-[11px] border-dashed py-1 px-3 uppercase tracking-wider" style={{ color: brandColor, borderColor: brandColor + '40' }}>
                    {coupon.code}
                  </Badge>
                </div>
                <h4 className="text-[12px] font-bold text-[#333] line-clamp-2 leading-tight uppercase">
                  {coupon.description || `Save big on your next ${selectedOutlet?.brand} order`}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase">Valid on orders above ₹{coupon.minOrderAmount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 px-6 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
        Terms & conditions apply to all promotional codes
      </div>
    </div>
  );
}
