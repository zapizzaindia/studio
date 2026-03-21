"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile, Outlet } from '@/lib/types';
import { 
  Truck, 
  CheckCircle, 
  XCircle, 
  Loader, 
  CircleDot, 
  Volume2, 
  VolumeX, 
  Timer, 
  MapPin, 
  Phone, 
  Eye, 
  Navigation, 
  Share2, 
  IndianRupee, 
  MessageSquareText, 
  UserCheck, 
  Package, 
  CookingPot,
  ClipboardList
} from 'lucide-react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { refundRazorpayOrder } from '@/app/home/checkout/actions';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

const ACCEPTANCE_TIMEOUT_MS = 5 * 60 * 1000;

const OrderTimer = ({ createdAt, orderId, onTimeout }: { createdAt: any, orderId: string, onTimeout: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      if (!createdAt) return;
      const start = typeof createdAt.toMillis === 'function' ? createdAt.toMillis() : Date.now();
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, ACCEPTANCE_TIMEOUT_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) onTimeout(orderId);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [createdAt, orderId, onTimeout]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className={cn(
      "flex items-center gap-1 font-black text-[9px] tabular-nums tracking-tighter px-2 py-0.5 rounded-full border shadow-sm",
      timeLeft < 60000 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-orange-50 text-orange-600 border-orange-100"
    )}>
      <Timer className="h-3 w-3" />
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default function AdminOrdersPage() {
  const { user } = useUser();
  const profileId = user?.email?.toLowerCase().trim() || 'dummy';
  const { data: userProfile } = useDoc<UserProfile>('users', profileId);
  const outletId = userProfile?.outletId;
  const { data: outlet } = useDoc<Outlet>('outlets', outletId || 'dummy');
  
  const ordersFilter = useMemo(() => outletId ? ['outletId', '==', outletId] : undefined, [outletId]);
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', { 
    where: ordersFilter as any
  });

  const firestore = useFirestore();
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const alarmPlaying = useRef(false);

  useEffect(() => {
    alarmRef.current = new Audio("/sounds/order-alarm.mp3");
    if (alarmRef.current) {
      alarmRef.current.loop = true;
      alarmRef.current.volume = 1;
    }
  }, []);

  useEffect(() => {
    if (!orders || ordersLoading) return;

    const newOrders = orders.filter(o => o.status === "New");

    if (newOrders.length > 0 && !isMuted) {
      if (!alarmPlaying.current) {
        alarmRef.current?.play().catch(() => {});
        alarmPlaying.current = true;

        toast({
          title: "🚨 NEW ORDER RECEIVED!",
          description: "Kitchen attention required",
        });
      }
    }

    if (newOrders.length === 0) {
      if (alarmPlaying.current) {
        alarmRef.current?.pause();
        if (alarmRef.current) alarmRef.current.currentTime = 0;
        alarmPlaying.current = false;
      }
    }

  }, [orders, ordersLoading, isMuted, toast]);

  const handleUpdateStatus = (order: Order, status: OrderStatus, reason?: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', order.id);
    const updateData: any = { status };
    if (reason) updateData.cancellationReason = reason;

    if (status === 'Cancelled' && order.paymentMethod === 'Online' && order.paymentId) {
      toast({ title: "Initializing Refund", description: "Reversing online payment..." });
      
      refundRazorpayOrder(order.paymentId, order.total)
        .then(() => {
          updateDoc(orderRef, { paymentStatus: 'Refunded' });
          toast({ title: "Refund Success", description: "Gateway confirmed reversal." });
        })
        .catch((err) => {
          console.error("Refund Error:", err);
          toast({ variant: 'destructive', title: "Refund Failed", description: err.message || "Manual reversal required." });
        });
    }

    updateDoc(orderRef, updateData)
      .then(() => {
        toast({ title: "Status Updated" });

        if (status === "Preparing" || status === "Cancelled") {
          alarmRef.current?.pause();
          if (alarmRef.current) alarmRef.current.currentTime = 0;
          alarmPlaying.current = false;
        }

        if (selectedOrder?.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, status } : null);
        }
      })
      .catch(() => {
        toast({ variant: 'destructive', title: "Error updating status" });
      });
  };

  const handleAutoCancel = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    if (order && order.status === 'New') {
      handleUpdateStatus(order, 'Cancelled', 'Kitchen Timeout');
    }
  };

  const handleShareLocation = (order: Order) => {
    const addr = order.deliveryAddress;
    const mapLink = addr?.latitude ? `\n📍 *Map:* https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}` : '';
    const note = order.specialNote ? `\n\n📝 *KITCHEN NOTE:* ${order.specialNote.toUpperCase()}` : '';
    const payNote = `\n\n✅ *PRE-PAID ORDER*`;
    
    const host = window.location.origin.replace(/\/$/, "");
    const magicLink = `\n\n🚀 *MARK DELIVERED:* ${host}/delivery/${order.id}`;

    const text = `🍕 *${outlet?.brand === 'zfry' ? 'ZFRY' : 'ZAPIZZA'} ORDER* 🍕\n\n*ID:* #${order.id.slice(-6).toUpperCase()}\n*Customer:* ${order.customerName}\n*Phone:* ${order.customerPhone || 'N/A'}\n*Address:* ${addr?.flatNo}, ${addr?.area}, ${addr?.city}${mapLink}${note}${payNote}${magicLink}`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    if (ordersLoading) return (
      <div className="space-y-4">
        {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
      </div>
    );
    
    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    const sorted = filteredOrders ? [...filteredOrders].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()) : [];
    
    return (
      <div className="space-y-4 w-full">
        {sorted.length > 0 ? sorted.map((order) => (
          <Card key={order.id} className="border-none shadow-lg overflow-hidden transition-all rounded-[24px] bg-white active:scale-[0.98] w-full">
            <CardContent className="p-0">
              <div className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-left space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-primary text-[10px] tracking-widest font-mono uppercase">#{order.id.slice(-6).toUpperCase()}</span>
                      {order.status === 'New' && <OrderTimer createdAt={order.createdAt} orderId={order.id} onTimeout={handleAutoCancel} />}
                    </div>
                    <h3 className="font-black text-base text-[#111] uppercase italic leading-tight">{order.customerName}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-tight truncate">{order.deliveryAddress?.area || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-lg font-sans tabular-nums text-[#111]">₹{order.total.toFixed(0)}</p>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-0 px-2 border-primary/30 text-primary mt-1">{order.status}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="text-[8px] font-black uppercase h-5 px-2 bg-green-100 text-green-700 border-none">Pre-Paid</Badge>
                  {order.specialNote && (
                    <Badge variant="outline" className="text-[8px] font-black uppercase h-5 px-2 border-orange-200 text-orange-600 bg-orange-50 gap-1">
                      <MessageSquareText className="h-2.5 w-2.5" /> Note
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-2 bg-gray-50/80 grid grid-cols-2 gap-2 border-t">
                <Button variant="outline" className="h-10 rounded-xl font-black text-[9px] uppercase gap-1 bg-white shadow-sm border-none ring-1 ring-black/5" onClick={() => setSelectedOrder(order)}>
                    <Eye className="h-3.5 w-3.5 text-primary" /> View
                </Button>
                <Button variant="outline" className="h-10 rounded-xl font-black text-[9px] uppercase gap-1 bg-white shadow-sm border-none ring-1 ring-black/5" onClick={() => handleShareLocation(order)}>
                    <Share2 className="h-3.5 w-3.5 text-[#25D366]" /> Dispatch
                </Button>
                
                <div className="col-span-2">
                  {order.status === 'New' && (
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1 text-red-600 font-black text-[9px] uppercase h-12 rounded-xl" onClick={() => handleUpdateStatus(order, 'Cancelled', 'Rejected by Outlet')}>Reject</Button>
                      <Button className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black text-[10px] uppercase shadow-md" onClick={() => handleUpdateStatus(order, 'Preparing')}>
                        <CookingPot className="mr-2 h-4 w-4" /> Accept Order
                      </Button>
                    </div>
                  )}
                  {order.status === 'Preparing' && (
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black text-[10px] uppercase shadow-md" onClick={() => handleUpdateStatus(order, 'Out for Delivery')}>
                        <Truck className="mr-2 h-4 w-4" /> Mark Dispatched
                    </Button>
                  )}
                  {order.status === 'Out for Delivery' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 font-black text-[10px] uppercase shadow-md" onClick={() => handleUpdateStatus(order, 'Completed')}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Confirm Delivery
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-white rounded-[24px] border border-dashed border-gray-200">
            <CircleDot className="h-8 w-8 mb-3 opacity-20" />
            <p className="uppercase text-[9px] font-black tracking-[0.2em] text-center px-8 opacity-40">Queue Empty</p>
          </div>
        )}
      </div>
    );
  };
  
  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <div className="flex items-center justify-between bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 mb-4 shrink-0">
        <div className="text-left">
            <h1 className="font-headline text-lg font-black uppercase tracking-tight italic" style={{ color: brandColor }}>Kitchen Live</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest">Active Node Sync</p>
            </div>
        </div>
        <Button variant="outline" className="rounded-xl h-10 w-10 p-0 border-none bg-gray-50 shadow-inner ring-1 ring-black/5" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" style={{ color: brandColor }} />}
        </Button>
      </div>
      
      <Tabs defaultValue="New" className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex w-full mb-4 bg-white p-1 rounded-xl shadow-sm border border-gray-100 h-12 overflow-x-auto scrollbar-hide justify-start gap-1 shrink-0">
          {[
            { label: "New", value: "New" },
            { label: "Cooking", value: "Preparing" },
            { label: "Rider", value: "Out for Delivery" },
            { label: "Done", value: "Completed" },
            { label: "All", value: "All" }
          ].map(tab => (
            <TabsTrigger 
              key={tab.label} 
              value={tab.value} 
              className="flex-1 min-w-[70px] font-black text-[9px] uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all h-full px-2"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="flex-1 pb-32 overflow-y-auto scrollbar-hide">
          <TabsContent value="All" className="mt-0 outline-none"><OrderTable statusFilter="All" /></TabsContent>
          <TabsContent value="New" className="mt-0 outline-none"><OrderTable statusFilter="New" /></TabsContent>
          <TabsContent value="Preparing" className="mt-0 outline-none"><OrderTable statusFilter="Preparing" /></TabsContent>
          <TabsContent value="Out for Delivery" className="mt-0 outline-none"><OrderTable statusFilter="Out for Delivery" /></TabsContent>
          <TabsContent value="Completed" className="mt-0 outline-none"><OrderTable statusFilter="Completed" /></TabsContent>
        </div>
      </Tabs>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl h-[90dvh] sm:h-auto sm:rounded-[32px] p-0 overflow-hidden border-none shadow-2xl flex flex-col bg-white outline-none">
          {selectedOrder && (
            <>
              <DialogHeader className="p-5 sm:p-8 text-white space-y-2 shrink-0 relative" style={{ backgroundColor: brandColor }}>
                <div className="flex justify-between items-center pr-8">
                  <div className="space-y-0.5 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Terminal Manifest</p>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter italic leading-none font-sans">#{selectedOrder.id.slice(-6).toUpperCase()}</DialogTitle>
                  </div>
                  <Badge variant="outline" className="text-white border-white/30 bg-white/10 uppercase text-[9px] font-black px-3 py-1 rounded-full">{selectedOrder.status}</Badge>
                </div>
              </DialogHeader>
              
              <div className="p-5 sm:p-8 space-y-6 overflow-y-auto scrollbar-hide flex-1 bg-white">
                {selectedOrder.specialNote && (
                  <div className="space-y-2 text-left">
                    <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquareText className="h-3 w-3" /> Special Note
                    </h4>
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-[16px]">
                      <p className="text-xs font-bold text-orange-950 uppercase italic leading-relaxed">
                        "{selectedOrder.specialNote}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Customer</h4>
                        <div className="bg-gray-50 p-4 rounded-[20px] border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-black uppercase text-[#111]">{selectedOrder.customerName}</p>
                                <p className="text-[11px] font-black tracking-widest text-primary font-sans tabular-nums mt-0.5">{selectedOrder.customerPhone || "N/A"}</p>
                            </div>
                            <Button size="icon" className="h-9 w-9 rounded-full bg-white shadow-md border border-gray-100" variant="ghost" onClick={() => window.open(`tel:${selectedOrder.customerPhone}`, '_self')}>
                                <Phone className="h-4 w-4" style={{ color: brandColor }} />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Destination</h4>
                        <div className="bg-gray-50 p-4 rounded-[20px] border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="text-left flex-1 pr-2">
                                    <Badge className="text-[8px] font-black uppercase mb-2 bg-white border-gray-200 text-gray-500 px-2">{selectedOrder.deliveryAddress?.label || "HOME"}</Badge>
                                    <p className="text-[11px] font-bold text-[#333] leading-snug">{selectedOrder.deliveryAddress?.flatNo}, {selectedOrder.deliveryAddress?.area}</p>
                                </div>
                                {selectedOrder.deliveryAddress?.latitude && (
                                    <Button size="icon" className="h-9 w-9 rounded-full bg-white shadow-md border border-gray-100 shrink-0" variant="ghost" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryAddress.latitude},${selectedOrder.deliveryAddress.longitude}`, '_blank')}>
                                        <Navigation className="h-4 w-4" style={{ color: brandColor }} />
                                    </Button>
                                )}
                            </div>
                            <Button variant="outline" className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest bg-white border-none shadow-sm gap-2" onClick={() => handleShareLocation(selectedOrder)}>
                                <Share2 className="h-3.5 w-3.5" style={{ color: brandColor }} /> Share To Rider
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><ClipboardList className="h-3 w-3"/> Items</h4>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase h-5 px-2">{selectedOrder.items.length} SKUs</Badge>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-gray-50/50 p-3 rounded-[16px] border border-gray-100/50">
                        <div className="flex gap-3">
                          <span className="font-black h-7 w-7 rounded-lg flex items-center justify-center text-[9px] shadow-sm font-sans tabular-nums bg-white border" style={{ color: brandColor }}>{item.quantity}x</span>
                          <div className="flex flex-col gap-1 text-left">
                            <span className="font-black text-xs uppercase tracking-tight text-[#111] italic leading-tight">{item.name}</span>
                            <div className="flex flex-wrap gap-1">
                                {item.variation && <Badge className="text-[7px] font-black uppercase px-1.5 py-0 bg-[#111] text-white rounded-sm border-none">{item.variation}</Badge>}
                                {item.addons?.map((a, i) => <Badge key={i} variant="outline" className="text-[7px] font-black uppercase px-1.5 py-0 border-dashed rounded-sm" style={{ borderColor: brandColor + '40', color: brandColor }}>+ {a}</Badge>)}
                            </div>
                          </div>
                        </div>
                        <span className="font-black text-xs text-[#111] font-sans tabular-nums">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-100/50 p-5 rounded-[24px] space-y-2 shadow-inner border border-gray-100 text-left">
                  <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest"><span>Net Base</span><span className="font-sans tabular-nums">₹{selectedOrder.subtotal.toFixed(0)}</span></div>
                  <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest"><span>Logistics</span><span className="font-sans tabular-nums">₹{selectedOrder.deliveryFee.toFixed(0)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-[9px] font-black text-green-600 uppercase tracking-widest"><span>Campaign</span><span className="font-sans tabular-nums">-₹{selectedOrder.discount.toFixed(0)}</span></div>}
                  <Separator className="bg-gray-300/50 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-[#111] italic">Settlement</span>
                    <span className="text-xl font-black tracking-tighter italic font-sans tabular-nums" style={{ color: brandColor }}>₹{selectedOrder.total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t flex flex-col gap-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-gray-50 border-none">Close</Button>
                  {selectedOrder.status === 'New' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, 'Preparing')} className="flex-[2] text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg border-none" style={{ backgroundColor: brandColor }}>Accept</Button>
                  )}
                  {selectedOrder.status === 'Preparing' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, 'Out for Delivery')} className="flex-[2] text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg border-none" style={{ backgroundColor: brandColor }}>Dispatch</Button>
                  )}
                  {selectedOrder.status === 'Out for Delivery' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, 'Completed')} className="flex-[2] text-white h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg bg-green-600 border-none">Delivered</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}