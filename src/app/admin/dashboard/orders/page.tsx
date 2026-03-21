"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile, Outlet } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot, Volume2, VolumeX, Timer, MapPin, Phone, Eye, Crown, Navigation, Share2, IndianRupee, CreditCard, Ticket, MessageSquareText, UserCheck, PackageCheck, Wallet, RefreshCcw } from 'lucide-react';
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
    <div className={`flex items-center gap-1.5 font-black text-[10px] tabular-nums tracking-tighter ${timeLeft < 60000 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
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
          toast({ variant: 'destructive', title: "Refund Failed", description: err.message || "Manual reversal required in Razorpay." });
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
    if (ordersLoading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;
    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    
    return (
      <div className="space-y-4">
        {filteredOrders && filteredOrders.length > 0 ? [...filteredOrders].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((order) => (
          <Card key={order.id} className="border-none shadow-sm overflow-hidden group active:scale-[0.99] transition-all rounded-2xl">
            <CardContent className="p-0">
              <div className="p-4 flex justify-between items-start bg-white border-b border-gray-50">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-primary text-[13px] tracking-widest font-sans uppercase">#{order.id.slice(-6).toUpperCase()}</span>
                    {order.status === 'New' && <OrderTimer createdAt={order.createdAt} orderId={order.id} onTimeout={handleAutoCancel} />}
                  </div>
                  <p className="font-bold text-[13px] text-[#333] uppercase leading-none">{order.customerName}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-wide">
                    <MapPin className="h-3 w-3" /> {order.deliveryAddress?.area || "N/A"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {order.specialNote && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit uppercase">
                        <MessageSquareText className="h-2.5 w-2.5" /> Note
                        </div>
                    )}
                    <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1.5 border-green-200 text-green-600">
                        Paid Online
                    </Badge>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-black text-[13px] font-sans tabular-nums">₹{order.total.toFixed(0)}</p>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-0.5 border-primary/20 text-primary">{order.status}</Badge>
                </div>
              </div>
              <div className="p-3 bg-gray-50/50 flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="flex-1 sm:flex-none h-9 px-3 rounded-xl font-bold text-[10px] uppercase gap-2 bg-white shadow-sm border-none"><Eye className="h-3.5 w-3.5" /> Details</Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareLocation(order)} className="flex-1 sm:flex-none h-9 px-3 rounded-xl font-bold text-[10px] uppercase gap-2 bg-white shadow-sm border-none"><Share2 className="h-3.5 w-3.5" /> Rider</Button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {order.status === 'New' && (
                    <>
                      <Button variant="ghost" size="sm" className="flex-1 sm:flex-none text-red-600 font-black text-[10px] uppercase h-9" onClick={() => handleUpdateStatus(order, 'Cancelled', 'Rejected by Outlet')}>Reject</Button>
                      <Button size="sm" className="flex-[2] sm:flex-none bg-primary hover:bg-primary/90 text-white rounded-xl px-4 h-9 font-black text-[10px] uppercase shadow-md" onClick={() => handleUpdateStatus(order, 'Preparing')}>Accept</Button>
                    </>
                  )}
                  {order.status === 'Preparing' && (
                    <Button size="sm" className="w-full sm:flex-none bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-9 font-black text-[10px] uppercase shadow-md" onClick={() => handleUpdateStatus(order, 'Out for Delivery')}>Mark Dispatched</Button>
                  )}
                  {order.status === 'Out for Delivery' && (
                    <Button size="sm" className="w-full sm:flex-none bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-9 font-black text-[10px] uppercase shadow-md" onClick={() => handleUpdateStatus(order, 'Completed')}>Mark Delivered</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : <div className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-white rounded-3xl border border-dashed border-gray-200">
            <CircleDot className="h-8 w-8 mb-2 opacity-20" />
            <p className="uppercase text-[10px] font-black tracking-widest">No active orders in this queue</p>
          </div>}
      </div>
    );
  };
  
  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="container mx-auto p-0 max-w-4xl">
      <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
        <div className="text-left">
            <h1 className="font-headline text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Kitchen Pipeline</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <p className="text-muted-foreground text-[9px] uppercase font-black tracking-widest">{outlet?.name || 'Authorized Node'}</p>
            </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl h-10 w-10 p-0 border-none bg-gray-50 shadow-inner" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" style={{ color: brandColor }} />}
        </Button>
      </div>
      
      <Tabs defaultValue="New" className="w-full">
        <TabsList className="flex w-full mb-6 bg-white/50 backdrop-blur-md p-1 rounded-xl shadow-sm border border-gray-100 h-12 overflow-x-auto scrollbar-hide justify-start sm:justify-center">
          {["New", "Preparing", "Out for Delivery", "Completed", "Cancelled", "All"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="flex-shrink-0 font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all h-full px-4">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="All"><OrderTable statusFilter="All" /></TabsContent>
        <TabsContent value="New"><OrderTable statusFilter="New" /></TabsContent>
        <TabsContent value="Preparing"><OrderTable statusFilter="Preparing" /></TabsContent>
        <TabsContent value="Out for Delivery"><OrderTable statusFilter="Out for Delivery" /></TabsContent>
        <TabsContent value="Completed"><OrderTable statusFilter="Completed" /></TabsContent>
        <TabsContent value="Cancelled"><OrderTable statusFilter="Cancelled" /></TabsContent>
      </Tabs>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
          {selectedOrder && (
            <>
              <DialogHeader className="p-6 text-white space-y-2 shrink-0" style={{ backgroundColor: brandColor }}>
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Gourmet Command</p>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none font-sans">#{selectedOrder.id.slice(-6).toUpperCase()}</DialogTitle>
                  </div>
                  <Badge variant="outline" className="text-white border-white/20 bg-white/10 uppercase text-[9px] font-black px-3 py-1 rounded-full">{selectedOrder.status}</Badge>
                </div>
              </DialogHeader>
              
              <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1 bg-white">
                {selectedOrder.specialNote && (
                  <div className="space-y-2 text-left">
                    <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquareText className="h-3 w-3" /> Customer Note
                    </h4>
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                      <p className="text-xs font-bold text-orange-950 uppercase italic leading-relaxed">
                        "{selectedOrder.specialNote}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 text-left">
                        <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><UserCheck className="h-2.5 w-2.5" /> Customer</h4>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                            <div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase">Name</p>
                                <p className="text-xs font-black uppercase text-[#333]">{selectedOrder.customerName}</p>
                            </div>
                            <Separator className="bg-gray-200/50" />
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black tracking-widest text-[#333] font-sans tabular-nums">{selectedOrder.customerPhone || "N/A"}</p>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white shadow-sm" onClick={() => window.open(`tel:${selectedOrder.customerPhone}`, '_self')}><Phone className="h-3 w-3" style={{ color: brandColor }} /></Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 text-left">
                        <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><MapPin className="h-2.5 w-2.5" /> Delivery</h4>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="text-left">
                                    <Badge className="text-[7px] font-black uppercase mb-1 bg-white border-gray-200 text-gray-500">{selectedOrder.deliveryAddress?.label || "HOME"}</Badge>
                                    <p className="text-[10px] font-medium text-muted-foreground leading-tight">{selectedOrder.deliveryAddress?.flatNo}, {selectedOrder.deliveryAddress?.area}</p>
                                </div>
                                {selectedOrder.deliveryAddress?.latitude && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white shadow-sm shrink-0" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryAddress.latitude},${selectedOrder.deliveryAddress.longitude}`, '_blank')}><Navigation className="h-3 w-3" style={{ color: brandColor }} /></Button>
                                )}
                            </div>
                            <Button variant="outline" className="w-full h-8 rounded-xl font-black uppercase text-[8px] tracking-widest bg-white border-none shadow-sm gap-2" onClick={() => handleShareLocation(selectedOrder)}><Share2 className="h-2.5 w-2.5" style={{ color: brandColor }} /> Share To WhatsApp</Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Order Items</h4>
                    <Badge variant="secondary" className="text-[7px] font-black uppercase">{selectedOrder.items.length} SKUs</Badge>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                        <div className="flex gap-3">
                          <span className="font-black h-7 w-7 rounded-lg flex items-center justify-center text-xs shadow-sm font-sans tabular-nums" style={{ backgroundColor: brandColor + '15', color: brandColor }}>{item.quantity}x</span>
                          <div className="flex flex-col gap-1 text-left">
                            <span className="font-black text-xs uppercase tracking-tight text-[#333] italic">{item.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                                {item.variation && <Badge className="text-[7px] font-black uppercase px-1.5 py-0 bg-[#333] text-white rounded-sm border-none">{item.variation}</Badge>}
                                {item.addons?.map((a, i) => <Badge key={i} variant="outline" className="text-[7px] font-black uppercase px-1.5 py-0 border-dashed rounded-sm" style={{ borderColor: brandColor + '40', color: brandColor }}>+ {a}</Badge>)}
                            </div>
                          </div>
                        </div>
                        <span className="font-black text-xs text-[#333] font-sans tabular-nums">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 space-y-3 shadow-inner">
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest"><span>Net Total</span><span className="font-sans tabular-nums">₹{selectedOrder.subtotal.toFixed(0)}</span></div>
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest"><span>Delivery</span><span className="font-sans tabular-nums">₹{selectedOrder.deliveryFee.toFixed(0)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest animate-pulse"><span>Discount</span><span className="font-sans tabular-nums">-₹{selectedOrder.discount.toFixed(0)}</span></div>}
                  <Separator className="bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-[#333] italic">Settle Amount</span>
                    <span className="text-2xl font-black tracking-tighter italic font-sans tabular-nums" style={{ color: brandColor }}>₹{selectedOrder.total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/80 border-t flex flex-col gap-3 shrink-0">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white">Close</Button>
                  {selectedOrder.status === 'New' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, 'Preparing')} className="flex-[2] text-white h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg" style={{ backgroundColor: brandColor }}>Accept Order</Button>
                  )}
                  {selectedOrder.status === 'Preparing' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, 'Out for Delivery')} className="flex-[2] text-white h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg" style={{ backgroundColor: brandColor }}>Mark Dispatched</Button>
                  )}
                  {selectedOrder.status === 'Out for Delivery' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, 'Completed')} className="flex-[2] text-white h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg bg-green-600 hover:bg-green-700">Confirm Delivery</Button>
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
