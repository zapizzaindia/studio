
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  Ticket, 
  User, 
  ChevronRight, 
  History, 
  Info, 
  Check, 
  Gift,
  ArrowRight,
  LayoutGrid,
  ShoppingBag,
  Home as HomeIcon,
  Crown,
  Star,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser, useDoc, useCollection } from "@/firebase";
import type { UserProfile, Outlet, Coupon } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RewardsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  useEffect(() => {
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    if (savedOutlet) {
      try { setSelectedOutlet(JSON.parse(savedOutlet)); } catch(e) {}
    }
  }, []);

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;
    let points = 0;
    if (profile.displayName) points += 33;
    if (profile.email) points += 33;
    if (profile.birthday) points += 34;
    return points;
  }, [profile]);

  const { data: allCoupons } = useCollection<Coupon>('coupons', { 
    where: ['active', '==', true] 
  });
  const coupons = allCoupons?.filter(c => c.brand === selectedOutlet?.brand) || [];

  if (userLoading || profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center p-6">
        <Skeleton className="h-12 w-12 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground font-headline">Accessing Vault...</p>
      </div>
    );
  }

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';
  const brandName = selectedOutlet?.brand === 'zfry' ? 'Zfry' : 'Zapizza';

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24">
      {/* Immersive Brand Header */}
      <div 
        style={{ backgroundColor: brandColor }} 
        className="text-white px-6 pt-12 pb-16 rounded-b-[40px] relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10">
          <div className="bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-fit mb-8">
            <p className="text-[10px] font-medium opacity-80 uppercase tracking-wide font-headline">Welcome {profile?.displayName?.split(' ')[0] || 'Gourmet'}</p>
            <h2 className="text-xl font-black italic tracking-tighter font-headline">Order now to level up</h2>
          </div>

          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2 font-headline">LP Rewards</h1>
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest font-headline">Get LP Coins on Every Order</p>
        </div>

        {/* Decorative Gift Box Icon */}
        <div className="absolute top-12 right-4 w-32 h-32 opacity-20 rotate-12 pointer-events-none">
          <Gift className="w-full h-full text-white" strokeWidth={1} />
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 space-y-4">
        {/* Quick Action Icons */}
        <div className="grid grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2" onClick={() => router.push('/home/offers')}>
            <div className="w-full aspect-square bg-white rounded-2xl shadow-md flex items-center justify-center border border-gray-100">
              <span className="text-[10px] font-black text-[#333] uppercase leading-tight text-center px-2 font-headline">How it works</span>
            </div>
          </button>
          
          <button className="flex flex-col items-center gap-2">
            <div className="w-full aspect-square bg-[#4ade80]/20 rounded-2xl shadow-md flex flex-col items-center justify-center border border-[#4ade80]/30 text-[#14532d]">
              <Trophy className="h-6 w-6" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1 font-headline">Rewards</span>
            </div>
          </button>

          <button className="flex flex-col items-center gap-2 relative" onClick={() => router.push('/home/offers')}>
            <div className="w-full aspect-square bg-[#4ade80]/20 rounded-2xl shadow-md flex flex-col items-center justify-center border border-[#4ade80]/30 text-[#14532d]">
              <Ticket className="h-6 w-6" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1 font-headline">Offers</span>
            </div>
            {coupons.length > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-[#e31837] text-white border-white text-[8px] h-4 w-4 p-0 flex items-center justify-center font-black font-body tabular-nums">
                {coupons.length}
              </Badge>
            )}
          </button>

          <button className="flex flex-col items-center gap-2 relative" onClick={() => router.push('/home/profile')}>
            <div className="w-full aspect-square bg-[#4ade80]/20 rounded-2xl shadow-md flex flex-col items-center justify-center border border-[#4ade80]/30 text-[#14532d]">
              <User className="h-6 w-6" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1 font-headline">Profile</span>
            </div>
            <Badge className="absolute -top-1 -right-1 bg-[#14532d] text-white border-white text-[8px] h-auto px-1 font-black font-body tabular-nums">{completionPercentage}%</Badge>
          </button>
        </div>

        {/* Main Coin Card */}
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-6 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-[#333] leading-none font-body tabular-nums">{profile?.loyaltyPoints || 0} LP COINS</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 font-headline">1 LP Coin = ₹1</p>
              </div>
              <Button variant="outline" className="rounded-xl h-10 border-green-100 text-[#14532d] font-black text-[10px] uppercase tracking-widest gap-2 font-headline">
                View History <ChevronRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Eligibility Banner */}
            <div className="bg-[#fff3e0] py-2 px-6 border-y border-[#ffe0b2]">
              <button className="text-[10px] font-black text-[#e65100] uppercase tracking-widest underline decoration-2 underline-offset-4 flex items-center gap-1 font-headline">
                Eligibility Criteria <Info className="h-3 w-3" />
              </button>
            </div>

            {/* Progress Stepper */}
            <div className="p-8">
              <div className="relative flex justify-between items-center px-4 mb-8">
                {/* Connector Line */}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0" />
                
                {[
                  { label: "ACE", icon: <Crown className="h-3.5 w-3.5" />, active: true },
                  { label: "PRIME", icon: <Crown className="h-3.5 w-3.5" />, active: false },
                  { label: "ELITE", icon: <Star className="h-3.5 w-3.5" />, active: false },
                  { label: "LEGEND", icon: <Trophy className="h-3.5 w-3.5" />, active: false }
                ].map((tier, idx) => (
                  <div key={tier.label} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all",
                      tier.active ? "bg-[#14532d] text-white scale-110" : "bg-[#f1f2f6] text-gray-400"
                    )}>
                      {tier.icon}
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest font-headline",
                      tier.active ? "text-[#14532d]" : "text-gray-400"
                    )}>{tier.label}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-[#333] uppercase font-headline">
                  Order Worth <span className="font-black text-[#14532d] font-body tabular-nums">₹1000</span> To Reach ACE Level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion Banner */}
        {completionPercentage < 100 && (
          <div 
            onClick={() => router.push('/home/profile')}
            className="bg-gradient-to-r from-yellow-100 via-orange-50 to-yellow-100 p-4 rounded-2xl border border-yellow-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-lg">🎉</span>
            <p className="text-[10px] font-black uppercase text-orange-900 tracking-tight text-center font-headline">
              Complete your profile to {completionPercentage === 0 ? 'start' : 'unlock more'} personalized rewards
            </p>
          </div>
        )}

        {/* Redeemed Rewards Link */}
        <Card className="border-none shadow-sm rounded-2xl bg-white active:scale-[0.98] transition-all">
          <CardContent className="p-5 flex justify-between items-center">
            <span className="text-[13px] font-bold text-[#333] uppercase tracking-tight font-headline">Expired/Redeemed Rewards</span>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>

        {/* How it works Footer */}
        <div className="pt-8 pb-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gray-200" />
            <h3 className="text-xl font-black text-[#333] uppercase italic font-headline">How it works</h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#14532d] shrink-0 border border-green-100">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-[#333] font-headline">Order and Earn</h4>
                <p className="text-[10px] font-medium text-muted-foreground uppercase leading-relaxed font-headline">Place an order from any {brandName} outlet and get coins based on your bill value.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#14532d] shrink-0 border border-green-100">
                <Crown className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-[#333] font-headline">Level Up Rewards</h4>
                <p className="text-[10px] font-medium text-muted-foreground uppercase leading-relaxed font-headline">As you spend more, your account tier upgrades, giving you better conversion rates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
