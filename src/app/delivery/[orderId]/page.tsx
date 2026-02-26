"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { Order, Outlet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, MapPin, Phone, Package, Navigation, Loader2, IndianRupee, ShieldCheck, RefreshCcw, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RiderGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const orderId = params.orderId as string;

  const { data: order, loading: orderLoading, error } = useDoc<Order>('orders', orderId);
  const { data: outlet } = useDoc<Outlet>('outlets', order?.outletId || 'dummy');

  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMarkDelivered = () => {
    if (!db || !orderId) return;
    setIsUpdating(true);

    const orderRef = doc(db, 'orders', orderId);
    updateDoc(orderRef, { status: 'Completed' })
      .then(() => {
        setSuccess(true);
        toast({ title: "Order Completed", description: "Kitchen updated successfully." });
      })
      .catch((err) => {
        console.error("Update error:", err);
        toast({ variant: 'destructive', title: "Sync Failed", description: "Check your internet connection." });
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  if (orderLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 gap-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <Package className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identifying Manifest...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-orange-400 mb-4" />
        <h1 className="text-xl font-black uppercase text-[#333]">Order Not Found</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase mt-2 max-w-xs">
          This link might be invalid or the order has been moved. 
        </p>
        <Button 
            variant="outline" 
            className="mt-8 rounded-xl font-black uppercase text-[10px] tracking-widest"
            onClick={() => window.location.reload()}
        >
            <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Retry Fetch
        </Button>
      </div>
    );
  }

  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';
  const isPaid = order.paymentMethod === 'Online' || order.paymentStatus === 'Success';

  return (
    <div className="min-h-screen bg-[#f1f2f6] pb-12 flex flex-col items-center justify-start p-4">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="portal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-md space-y-6 pt-8"
          >
            {/* Header / Brand */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg shadow-black/5" style={{ backgroundColor: brandColor }}>
                <Package className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Rider Terminal</h1>
              <Badge variant="outline" className="font-black uppercase text-[10px] tracking-widest bg-white">ID: #{orderId.slice(-6).toUpperCase()}</Badge>
            </div>

            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-8 space-y-8 text-left">
                {/* 1. Customer Intelligence */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Delivery Destination</h4>
                    <Badge className={cn("text-[8px] font-black uppercase border-none", isPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                        {isPaid ? 'PAID ONLINE' : 'CASH ON DELIVERY'}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                    <div>
                      <p className="text-sm font-black uppercase text-[#333] tracking-tight">{order.customerName}</p>
                      <button 
                        onClick={() => window.open(`tel:${order.customerPhone}`, '_self')}
                        className="flex items-center gap-2 text-xs font-black mt-1" 
                        style={{ color: brandColor }}
                      >
                        <Phone className="h-3.5 w-3.5" /> {order.customerPhone || 'N/A'}
                      </button>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                        {order.deliveryAddress?.flatNo}, {order.deliveryAddress?.area}, {order.deliveryAddress?.city}
                      </p>
                      {order.deliveryAddress?.landmark && (
                        <p className="text-[9px] font-black mt-1 uppercase italic" style={{ color: brandColor }}>Near: {order.deliveryAddress.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Collection Intelligence */}
                <div className={cn(
                    "p-6 rounded-2xl flex items-center justify-between border",
                    isPaid ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isPaid ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                    )}>
                      <IndianRupee className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: isPaid ? '#14532d' : '#92400e' }}>
                        {isPaid ? 'Verification' : 'Amount to Collect'}
                      </p>
                      <p className="text-xl font-black" style={{ color: isPaid ? '#14532d' : '#451a03' }}>
                        ₹{isPaid ? '0.00' : order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {isPaid && (
                    <Badge className="bg-green-600 text-white text-[8px] font-black uppercase border-none">PRE-PAID</Badge>
                  )}
                </div>

                {/* 3. Confirmation Trigger */}
                <div className="space-y-4">
                  {order.status === 'Completed' ? (
                    <div className="bg-green-50 p-6 rounded-2xl flex flex-col items-center gap-2 border border-green-100">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                      <p className="text-xs font-black uppercase text-green-800">Delivered Successfully</p>
                    </div>
                  ) : order.status === 'Cancelled' ? (
                    <div className="bg-red-50 p-6 rounded-2xl flex flex-col items-center gap-2 border border-red-100">
                      <p className="text-xs font-black uppercase text-red-800">This Order was Cancelled</p>
                    </div>
                  ) : (
                    <>
                      <Button 
                        onClick={handleMarkDelivered}
                        disabled={isUpdating}
                        className="w-full h-16 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 text-sm"
                        style={{ backgroundColor: brandColor }}
                      >
                        {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : "I'VE DELIVERED THE ORDER"}
                      </Button>
                      <div className="flex items-center justify-center gap-2 opacity-40">
                        <ShieldCheck className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Secure Terminal Log</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <button 
              onClick={() => router.push('/home')}
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full text-center hover:text-[#333] pt-4"
            >
              Exit Terminal
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6 pt-20"
          >
            <div className="h-24 w-24 rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#333]">Excellent Work!</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase max-w-xs px-4">The outlet and customer have been notified of your delivery.</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => window.close()}
              className="h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest border-2"
            >
              Close Window
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
