
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Search, Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-between pt-4 max-w-3xl mx-auto w-full">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <ZapizzaLogo className="h-10 w-10 text-primary" />
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center pt-6 text-center max-w-3xl mx-auto w-full">
        <h1 className="font-headline text-3xl font-black text-primary italic uppercase tracking-tighter">Choose Brand</h1>
        <p className="max-w-xs text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">
          Select a brand vertical to explore the menu.
        </p>
      </div>

      <div className="my-8 max-w-3xl mx-auto w-full px-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search brands..." className="pl-10 h-12 rounded-xl font-bold border-gray-100 shadow-inner bg-gray-50/50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide max-w-3xl mx-auto w-full">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 px-2">BRANDS NEAR YOU</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-2">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="aspect-square w-full rounded-[40px]" />
          )) : (
            outlets?.map((outlet) => {
              const brandColor = outlet.brand === 'zfry' ? '#e31837' : '#14532d';
              const bgColor = outlet.brand === 'zfry' ? 'bg-red-50' : 'bg-green-50';
              
              return (
                <motion.div
                  key={outlet.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={cn(
                    "relative aspect-square flex flex-col rounded-[40px] overflow-hidden border border-gray-50 shadow-2xl shadow-black/5 cursor-pointer transition-all duration-300 active:shadow-sm group",
                    !outlet.isOpen && "opacity-60 grayscale-[0.5]",
                    bgColor
                  )}
                  onClick={() => outlet.isOpen && onOutletSelect(outlet)}
                >
                  {/* Status Badge */}
                  <div className="absolute top-5 right-5 z-10">
                     <Badge 
                       variant={outlet.isOpen ? "secondary" : "destructive"} 
                       className="text-[8px] font-black uppercase h-5 px-2.5 border-none shadow-md font-headline bg-white"
                       style={{ color: outlet.isOpen ? brandColor : '#e31837' }}
                     >
                       {outlet.isOpen ? "Live" : "Offline"}
                     </Badge>
                  </div>

                  {/* Visual Brand Section */}
                  <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                    <motion.div 
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <img
                        src={outlet.brand === 'zfry' ? "/zfry-logo.png" : "/zapizza-icon.png"}
                        alt={outlet.brand}
                        className="w-full h-full object-contain drop-shadow-xl"
                      />
                    </motion.div>
                  </div>

                  {/* Dynamic Accent Bar */}
                  <div 
                    className="h-2 w-16 mx-auto mb-6 rounded-full opacity-30 shadow-inner" 
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
