
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot, Volume2, VolumeX, Timer, MapPin, Phone, Eye, Crown, Navigation, Share2, IndianRupee, CreditCard, Ticket } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
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
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  const outletId = userProfile?.outletId;
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', { where: outletId ? ['outletId', '==', outletId] : undefined });
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const prevNewOrdersCount = useRef<number>(0);

  useEffect(() => {
    if (!orders || ordersLoading) return;
    const newOrders = orders.filter(o => o.status === 'New');
    if (newOrders.length > prevNewOrdersCount.current) {
      if (!isMuted) new Audio(ALERT_SOUND_URL).play().catch(() => {});
      toast({ title: "NEW ORDER RECEIVED!", variant: "default" });
    }
    prevNewOrdersCount.current = newOrders.length;
  }, [orders, ordersLoading, isMuted, toast]);

  const handleUpdateStatus = (orderId: string, status: OrderStatus, reason?: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status };
    if (reason) updateData.cancellationReason = reason;

    updateDoc(orderRef, updateData)
      .then(() => {
        toast({ title: "Status Updated" });
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
      })
      .catch(() => {
        toast({ variant: 'destructive', title: "Error updating status" });
      });
  };

  const handleAutoCancel = (orderId: string) => handleUpdateStatus(orderId, 'Cancelled', 'Kitchen Timeout');

  const handleShareLocation = (order: Order) => {
    const addr = order.deliveryAddress;
    const mapLink = addr?.latitude ? `\n📍 *Map:* https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}` : '';
    const text = `🍕 *Zapizza/Zfry Order* 🍕\n\n*ID:* #${order.id.slice(-6).toUpperCase()}\n*Customer:* ${order.customerName}\n*Phone:* ${order.customerPhone || 'N/A'}\n*Address:* ${addr?.flatNo}, ${addr?.area}, ${addr?.city}${mapLink}\n\n*Items:*\n${order.items.map(i => `- ${i.quantity}x ${i.name} (${i.variation || 'Base'})${i.addons ? ' +' + i.addons.join(', ') : ''}`).join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    if (ordersLoading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;
    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    
    return (
      <div className="space-y-4">
        {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map((order) => (
          <Card key={order.id} className="border-none shadow-sm overflow-hidden group active:scale-[0.99] transition-all rounded-2xl">
            <CardContent className="p-0">
              <div className="p-5 flex justify-between items-start bg-white border-b border-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-primary text-sm tracking-widest">#{order.id.slice(-6).toUpperCase()}</span>
                    {order.status === 'New' && <OrderTimer createdAt={order.createdAt} orderId={order.id} onTimeout={handleAutoCancel} />}
                  </div>
                  <p className="font-bold text-[13px] text-[#333] uppercase leading-none">{order.customerName}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-wide">
                    <MapPin className="h-3 w-3" /> {order.deliveryAddress?.area || "N/A"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-black text-sm">₹{order.total.toFixed(2)}</p>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-0.5 border-primary/20 text-primary">{order.status}</Badge>
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase gap-2 bg-white shadow-sm border-none"><Eye className="h-3.5 w-3.5" /> Details</Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareLocation(order)} className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase gap-2 bg-white shadow-sm border-none"><Share2 className="h-3.5 w-3.5" /> Share</Button>
                </div>
                {order.status === 'New' && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-red-600 font-black text-[10px] uppercase h-9" onClick={() => handleUpdateStatus(order.id, 'Cancelled', 'Rejected by Outlet')}>Reject</Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-9 font-black text-[10px] uppercase shadow-md shadow-primary/20" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>Accept</Button>
                  </div>
                )}
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
  
  return (
    <div className="container mx-auto p-0 max-w-4xl">
      <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic text-primary">Kitchen Pipeline</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">{userProfile?.outletId || 'Connecting...'}</p>
            </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-2xl h-12 w-12 p-0 border-none bg-gray-50 shadow-inner" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5 text-primary" />}
        </Button>
      </div>
      
      <Tabs defaultValue="New" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-8 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 h-14">
          {["New", "Preparing", "Out for Delivery", "Completed", "Cancelled", "All"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
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
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
          {selectedOrder && (
            <>
              <DialogHeader className="p-8 bg-primary text-white space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Order Reference</p>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">#{selectedOrder.id.slice(-6).toUpperCase()}</DialogTitle>
                  </div>
                  <Badge variant="outline" className="text-white border-white/20 bg-white/10 uppercase text-[9px] font-black px-3 py-1">{selectedOrder.status}</Badge>
                </div>
              </DialogHeader>
              
              <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1 bg-white">
                {/* Delivery Pin Info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Rider Intelligence</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-none bg-gray-50" onClick={() => handleShareLocation(selectedOrder)}><Share2 className="h-3 w-3 mr-1.5 text-primary" /> Share Link</Button>
                      {selectedOrder.deliveryAddress?.latitude && (
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-none bg-gray-50" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryAddress.latitude},${selectedOrder.deliveryAddress.longitude}`, '_blank')}><Navigation className="h-3 w-3 mr-1.5 text-primary" /> GPS Map</Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4 shadow-inner">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-primary"><MapPin className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tight text-[#333]">{selectedOrder.deliveryAddress?.label || "Home"}</p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-relaxed">{selectedOrder.deliveryAddress?.flatNo}, {selectedOrder.deliveryAddress?.area}, {selectedOrder.deliveryAddress?.city}</p>
                        {selectedOrder.deliveryAddress?.landmark && <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-wide italic">Near: {selectedOrder.deliveryAddress.landmark}</p>}
                      </div>
                    </div>
                    <Separator className="bg-gray-200/50" />
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-primary"><Phone className="h-4 w-4" /></div>
                      <p className="text-[11px] font-black tracking-widest">{selectedOrder.customerPhone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Order Manifest</h4>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs bg-white rounded-xl transition-all">
                        <div className="flex gap-4">
                          <span className="font-black text-primary bg-primary/5 h-7 w-7 rounded-lg flex items-center justify-center text-[10px]">{item.quantity}x</span>
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-[13px] uppercase tracking-tight text-[#333] italic">{item.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                                {item.variation && <Badge variant="secondary" className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border-none">{item.variation}</Badge>}
                                {item.addons?.map((a, i) => <Badge key={i} variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0.5 border-dashed border-primary/30 text-primary">+{a}</Badge>)}
                            </div>
                          </div>
                        </div>
                        <span className="font-black text-sm text-[#333]">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 space-y-3 shadow-inner">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><span>Item Subtotal</span><span>₹{selectedOrder.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><span>Taxes (GST)</span><span>₹{selectedOrder.gst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><span>Delivery Partner Fee</span><span>₹{selectedOrder.deliveryFee.toFixed(2)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest"><span>Loyalty/Promo Discount</span><span>-₹{selectedOrder.discount.toFixed(2)}</span></div>}
                  <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[13px] font-black uppercase text-[#333] tracking-tighter italic">Grand Total</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge className="bg-green-500/10 text-green-600 border-none text-[8px] font-black uppercase px-1.5">PRE-PAID</Badge>
                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                        </div>
                    </div>
                    <span className="text-2xl font-black text-primary tracking-tighter italic">₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Loyalty Info */}
                <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                        <Crown className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Loyalty Points Earned</span>
                        <span className="text-xs font-bold text-[#333]">{Math.floor(selectedOrder.subtotal / 100)} Points Added to Customer</span>
                    </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50/80 border-t flex gap-4">
                <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">Close</Button>
                {selectedOrder.status === 'New' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'Preparing')} className="flex-[2] bg-primary text-white hover:bg-primary/90 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Accept Order</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
