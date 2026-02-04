"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-[#14532d]/10 p-8 rounded-full mb-8"
      >
        <CheckCircle2 className="h-20 w-20 text-[#14532d]" />
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black text-[#14532d] uppercase italic mb-4"
      >
        Order Placed!
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-12 max-w-xs"
      >
        Your delicious Zapizza is being prepared and will reach you shortly.
      </motion.p>
      
      <div className="w-full space-y-4 max-w-xs">
        <Button 
          onClick={() => router.push('/home/orders')}
          className="w-full h-14 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          TRACK ORDER <ShoppingBag className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="ghost"
          onClick={() => router.push('/home')}
          className="w-full h-12 text-muted-foreground font-black uppercase tracking-widest"
        >
          BACK TO HOME <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
