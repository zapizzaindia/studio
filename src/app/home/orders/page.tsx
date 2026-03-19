"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, Package, Truck, CheckCircle2, XCircle, AlertCircle, RefreshCcw, CookingPot, Home, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Order, OrderStatus, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const OrderTrackingMap = dynamic(() => import('@/components/order-tracking-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-[24px]" />
});

const statusIcons: Record<string, React.ReactNode> = {
  "New": <Package className="h-4 w-4 text-blue-500" />,
  "Preparing": <CookingPot className="h-4 w-4 text-yellow-500 animate-bounce" />,
  "Out for Delivery": <Truck className="h-4 w-4 text-orange-500 animate-pulse" />,
  "Completed": <CheckCircle2 className="h-4 w-4 text-green-500" />,
  "Cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};

const StatusTracker = ({ status }: { status: OrderStatus }) => {
  const steps: { label: string; icon: any; targetStatus: OrderStatus[] }[] = [
    { label: "Placed", icon: Package, targetStatus: ["New", "Preparing", "Out for Delivery", "Completed"] },
    { label: "Preparing", icon: CookingPot, targetStatus: ["Preparing", "Out for Delivery", "Completed"] },
    { label: "Dispatched", icon: Truck, targetStatus: ["Out for Delivery", "Completed"] },
    { label: "Delivered", icon: Home, targetStatus: ["Completed"] },
  ];

  if (status === 'Cancelled') return null;

  return (
    <div className="py-4 px-2 font-headline">
      <div className="relative flex justify-between">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
        
        {steps.map((step, idx) => {
          const isDone = step.targetStatus.includes(status) && status !== step.targetStatus[0];
          const isCurrent = status === step.targetStatus[0];
          
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500",
                isDone ? "bg-green-50 text-white" : 
                isCurrent ? "bg-[#14532d] text-white scale-110 ring-4 ring-green-100" : 
                "bg-gray-100 text-gray-400"
              )}>
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest text-center",
                (isDone || isCurrent) ? "text-[#333]" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: orders, loading } = useCollection<Order>('orders', {
    where: user ? ['customerId', '==', user.uid] : undefined
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data: selectedOutlet } = useDoc<Outlet>('outlets', selectedOrder?.outletId || 'dummy');

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f1f2f6] pt-[calc(56px+env(safe-area-inset-top))]">
        <div className="bg-white border-b p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const sortedOrders = orders ? [...orders].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24 pt-[calc(56px+env(safe-area-inset-top))]">
      <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-30 bg-white border-b px-4 py-4 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black text-[#14532d] uppercase tracking-widest font-headline">My Orders</h1>
      </div>

      <div className="p-4 space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-20 font-headline">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-black text-[#14532d] uppercase italic">No orders yet</h3>
            <p className="text-muted-foreground mb-8">What are you waiting for? Feed your cravings!</p>
            <Button onClick={() => router.push('/home/menu')} className="bg-[#14532d] text-white px-8 rounded-xl font-black uppercase">ORDER NOW</Button>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <Card key={order.id} className="border-none shadow-sm overflow-hidden group active:scale-[0.98] transition-transform">
              <CardContent className="p-0">
                <div className="p-4 border-b flex justify-between items-start bg-white">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-headline">Order ID: <span className="font-sans tabular-nums">{order.id.slice(-6).toUpperCase()}</span></p>
                    <p className="text-sm font-black text-[#333333] mt-1 font-headline">
                    {order.items.map((i, index) => (
                      <span key={i.menuItemId}>
                        <span className="font-sans tabular-nums">{i.quantity}</span>x {i.name}
                        {index < order.items.length - 1 && ", "}
                      </span>
                    ))}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground mt-2 font-headline">
                      <Clock className="h-3 w-3" />
                      <span className="font-sans tabular-nums">{order.createdAt.toDate().toLocaleDateString()} at {order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 font-headline">
                    <Badge 
                      variant={order.status === 'Completed' ? 'secondary' : order.status === 'Cancelled' ? 'destructive' : 'default'}
                      className="uppercase text-[9px] font-black tracking-widest flex gap-1 items-center"
                    >
                      {statusIcons[order.status]}
                      {order.status}
                    </Badge>
                    {(order as any).cancellationReason && (
                      <span className="text-[8px] font-bold text-red-500 uppercase">Timeout</span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white flex justify-between items-center">
                  <div className="text-lg font-black text-[#14532d] font-sans tabular-nums">
                    ₹{order.total.toFixed(2)}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedOrder(order)}
                    className="text-[10px] font-black uppercase text-[#14532d] gap-1 pr-0 font-headline"
                  >
                    TRACK ORDER <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg rounded-[32px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[92vh]">
          {selectedOrder && (
            <div className="flex flex-col bg-white h-full overflow-hidden">
              <DialogHeader className="px-6 py-5 sm:p-8 bg-[#14532d] text-white shrink-0">
                <div className="flex justify-between items-start font-headline">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Real-Time Tracking</p>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                      #<span className="font-sans tabular-nums">{selectedOrder.id.slice(-6).toUpperCase()}</span>
                    </DialogTitle>
                  </div>
                  <Badge variant="outline" className="text-white border-white/20 bg-white/10 uppercase text-[10px] font-black px-4 py-1.5 rounded-full">
                    {selectedOrder.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="px-5 py-4 sm:p-8 space-y-6 overflow-y-auto scrollbar-hide font-headline flex-1">
                {selectedOrder.deliveryAddress.latitude && selectedOutlet?.latitude && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Navigation Hub</h4>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Signal Locked</span>
                      </div>
                    </div>
                    <div className="h-64 w-full rounded-[24px] overflow-hidden border-2 border-gray-50 shadow-inner relative group">
                      <OrderTrackingMap 
                        customerCoords={{ 
                          lat: selectedOrder.deliveryAddress.latitude, 
                          lng: selectedOrder.deliveryAddress.longitude! 
                        }}
                        outletCoords={{ 
                          lat: selectedOutlet.latitude, 
                          lng: selectedOutlet.longitude! 
                        }}
                        status={selectedOrder.status}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50/50 p-4 rounded-[24px] border border-gray-100">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Journey Progress</h4>
                  <StatusTracker status={selectedOrder.status} />
                </div>

                {selectedOrder.status === 'Cancelled' && (
                  <div className="bg-red-50 border border-red-100 p-5 rounded-[24px] flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-red-900 uppercase italic">Order Voided</p>
                      <p className="text-[10px] font-medium text-red-700 leading-relaxed uppercase mt-1">
                        {(selectedOrder as any).cancellationReason || "The kitchen was unable to process your order in time."}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-blue-600">
                        {selectedOrder.paymentStatus === 'Refunded' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Full Refund Processed</span>
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Full Refund Initialized</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kitchen Manifest</h4>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{selectedOrder.items.length} SKUs Identified</span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-gray-50/30 p-3 rounded-2xl border border-gray-100/50">
                        <div className="flex gap-3">
                          <span className="font-black text-[#14532d] bg-green-50 h-7 w-7 rounded-lg flex items-center justify-center text-[10px] shadow-sm font-sans tabular-nums">{item.quantity}x</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black text-[#333] uppercase italic font-headline">{item.name}</span>
                            {item.variation && (
                              <Badge className="w-fit text-[7px] font-black uppercase px-1.5 py-0 bg-gray-200 text-gray-600 rounded-sm border-none">{item.variation}</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#333] font-sans tabular-nums">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-2 bg-gray-50 p-5 rounded-[24px] font-headline">
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>Item Total</span>
                    <span className="font-sans tabular-nums">₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>Delivery Fee</span>
                    <span className={cn("font-sans tabular-nums", selectedOrder.deliveryFee === 0 ? "text-green-600 font-headline" : "")}>
                      {selectedOrder.deliveryFee === 0 ? "FREE" : `₹${selectedOrder.deliveryFee}`}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest animate-pulse">
                      <span>Promo Applied</span>
                      <span className="font-sans tabular-nums">-₹{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase">
                        <span>CGST ({( (selectedOrder as any).gstRate || 5 ) / 2}%)</span>
                        <span className="font-sans tabular-nums">₹{(selectedOrder.gst / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase">
                        <span>SGST ({( (selectedOrder as any).gstRate || 5 ) / 2}%)</span>
                        <span className="font-sans tabular-nums">₹{(selectedOrder.gst / 2).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed flex justify-between items-center">
                    <span className="text-sm font-black text-[#333] uppercase">Grand Total</span>
                    <span className="text-xl font-black text-[#14532d] italic font-sans tabular-nums">₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50/80 border-t shrink-0">
                <Button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full h-14 bg-[#14532d] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all font-headline"
                >
                  Close Tracking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
