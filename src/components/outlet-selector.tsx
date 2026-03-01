
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Search, Clock, CheckCircle2, XCircle, Flame, Pizza, ChevronRight } from "lucide-react";
import type { Outlet } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ZapizzaLogo } from "./icons";
import { useCollection } from "@/firebase";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type OutletSelectorProps = {
  cityId: string;
  onOutletSelect: (outlet: Outlet) => void;
  onBack: () => void;
};

export function OutletSelector({ cityId, onOutletSelect, onBack }: OutletSelectorProps) {
  const { data: outlets, loading } = useCollection<Outlet>('outlets', {
    where: ['cityId', '==', cityId]
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-background p-4"
    >
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <ZapizzaLogo className="h-10 w-10 text-primary" />
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center pt-6 text-center">
        <h1 className="font-headline text-3xl font-black text-primary italic uppercase tracking-tighter">Choose Brand</h1>
        <p className="max-w-xs text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">
          Select a brand vertical to explore the menu.
        </p>
      </div>

      <div className="my-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search brands..." className="pl-10 h-12 rounded-xl font-bold border-gray-100 shadow-inner bg-gray-50/50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">BRANDS NEAR YOU</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="aspect-square w-full rounded-[40px]" />
          )) : (
            outlets?.map((outlet) => {
              const brandColor = outlet.brand === 'zfry' ? '#e31837' : '#14532d';
              const bgColor = outlet.brand === 'zfry' ? 'bg-red-50' : 'bg-green-50';
              
              return (
                <motion.div
                  key={outlet.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative aspect-square flex flex-col rounded-[40px] overflow-hidden border border-gray-50 shadow-2xl shadow-black/5 cursor-pointer transition-all duration-300 active:shadow-sm group",
                    !outlet.isOpen && "opacity-60 grayscale-[0.5]",
                    bgColor
                  )}
                  onClick={() => outlet.isOpen && onOutletSelect(outlet)}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                     <Badge 
                       variant={outlet.isOpen ? "secondary" : "destructive"} 
                       className="text-[7px] font-black uppercase h-4 px-2 border-none shadow-sm font-headline bg-white text-current"
                       style={{ color: outlet.isOpen ? brandColor : undefined }}
                     >
                       {outlet.isOpen ? "Live" : "Offline"}
                     </Badge>
                  </div>

                  {/* Logo Section */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-active:scale-95" style={{ color: brandColor }}>
                       {outlet.brand === 'zfry' ? <Flame className="h-10 w-10 fill-current" /> : <Pizza className="h-10 w-10 fill-current" />}
                    </div>
                  </div>

                  {/* Visual Brand Accent */}
                  <div 
                    className="h-1.5 w-12 mx-auto mb-6 rounded-full opacity-20" 
                    style={{ backgroundColor: brandColor }}
                  />
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
