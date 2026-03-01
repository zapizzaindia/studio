
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
        <h1 className="font-headline text-3xl font-black text-primary italic uppercase tracking-tighter">Pick Your Flavor</h1>
        <p className="max-w-xs text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">
          Select a brand and node to begin your journey.
        </p>
      </div>

      <div className="my-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Find nearby store..." className="pl-10 h-12 rounded-xl font-bold border-gray-100 shadow-inner bg-gray-50/50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">AVAILABLE OUTLETS</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="h-48 w-full rounded-[32px]" />
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
                    "relative flex flex-col rounded-[32px] overflow-hidden border border-gray-100 bg-white shadow-xl shadow-black/5 cursor-pointer transition-all duration-300 active:shadow-sm",
                    !outlet.isOpen && "opacity-60 grayscale-[0.5]"
                  )}
                  onClick={() => outlet.isOpen && onOutletSelect(outlet)}
                >
                  {/* Top Brand Section */}
                  <div className={cn("h-28 flex items-center justify-center relative", bgColor)}>
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110" style={{ color: brandColor }}>
                       {outlet.brand === 'zfry' ? <Flame className="h-8 w-8" /> : <Pizza className="h-8 w-8" />}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                       <Badge 
                         variant={outlet.isOpen ? "secondary" : "destructive"} 
                         className="text-[7px] font-black uppercase h-4 px-1.5 border-none shadow-sm font-headline"
                       >
                         {outlet.isOpen ? "Live" : "Offline"}
                       </Badge>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3 text-left">
                    <div>
                      <h3 className="font-headline text-[13px] font-black uppercase tracking-tight line-clamp-2 leading-tight text-[#333] italic">
                        {outlet.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest font-roboto tabular-nums">
                          {outlet.openingTime} - {outlet.closingTime}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-60">{outlet.brand}</span>
                       <div className="h-6 w-6 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover:translate-x-1" style={{ backgroundColor: brandColor }}>
                          <ChevronRight className="h-3.5 w-3.5" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
