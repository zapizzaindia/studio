
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile, Outlet } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot, Volume2, VolumeX, Timer, MapPin, Phone, Eye, Crown, Navigation, Share2, IndianRupee, CreditCard, Ticket, MessageSquareText, UserCheck, PackageCheck } from 'lucide-react';
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
        if (selectedOrder?.id === orderId) {
            // Update local selected order state if the dialog is open
            setSelectedOrder(prev => prev ? { ...prev, status } : null);
        }
      })
      .catch(() => {
        toast({ variant: 'destructive', title: "Error updating status" });
      });
  };

  const handleAutoCancel = (orderId: string) => handleUpdateStatus(orderId, 'Cancelled', 'Kitchen Timeout');

  const handleShareLocation = (order: Order) => {
    const addr = order.deliveryAddress;
    const mapLink = addr?.latitude ? `\n📍 *Map:* https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}` : '';
    const note = order.specialNote ? `\n\n📝 *KITCHEN NOTE:* ${order.specialNote.toUpperCase()}` : '';
    const text = `🍕 *Zapizza/Zfry Order* 🍕\n\n*ID:* #${order.id.slice(-6).toUpperCase()}\n*Customer:* ${order.customerName}\n*Phone:* ${order.customerPhone || 'N/A'}\n*Address:* ${addr?.flatNo}, ${addr?.area}, ${addr?.city}${mapLink}${note}\n\n*Items:*\n${order.items.map(i => `- ${i.quantity}x ${i.name} (${i.variation || 'Standard'})${i.addons ? ' +' + i.addons.join(', ') : ''}`).join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    if (ordersLoading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;
    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    
    return (
      <div className="space-y-4">
        {filteredOrders && filteredOrders.length > 0 ? [...filteredOrders].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((order) => (
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
                  {order.specialNote && (
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit uppercase animate-pulse">
                      <MessageSquareText className="h-2.5 w-2.5" /> Special Instructions
                    </div>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="font-black text-sm">₹{order.total.toFixed(2)}</p>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-0.5 border-primary/20 text-primary">{order.status}</Badge>
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase gap-2 bg-white shadow-sm border-none transition-all hover:bg-white hover:scale-105 active:scale-95"><Eye className="h-3.5 w-3.5" /> Details</Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareLocation(order)} className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase gap-2 bg-white shadow-sm border-none transition-all hover:bg-white hover:scale-105 active:scale-95"><Share2 className="h-3.5 w-3.5" /> Dispatch Rider</Button>
                </div>
                {order.status === 'New' && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-red-600 font-black text-[10px] uppercase h-9" onClick={() => handleUpdateStatus(order.id, 'Cancelled', 'Rejected by Outlet')}>Reject</Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-9 font-black text-[10px] uppercase shadow-md shadow-primary/20" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>Accept Order</Button>
                  </div>
                )}
                {order.status === 'Preparing' && (
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-9 font-black text-[10px] uppercase shadow-md shadow-primary/20" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}>Mark Dispatched</Button>
                )}
                {order.status === 'Out for Delivery' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-9 font-black text-[10px] uppercase shadow-md shadow-green-900/20" onClick={() => handleUpdateStatus(order.id, 'Completed')}>Mark Delivered</Button>
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
  
  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="container mx-auto p-0 max-w-4xl">
      <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>Kitchen Pipeline</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">{outlet?.name || 'Authorized Node'}</p>
            </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-2xl h-12 w-12 p-0 border-none bg-gray-50 shadow-inner" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5" style={{ color: brandColor }} />}
        </Button>
      </div>
      
      <Tabs defaultValue="New" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-8 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 h-14 overflow-hidden">
          {["New", "Preparing", "Out for Delivery", "Completed", "Cancelled", "All"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all h-full">
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
              <DialogHeader className="p-8 text-white space-y-4" style={{ backgroundColor: brandColor }}>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Gourmet Command</p>
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">#{selectedOrder.id.slice(-6).toUpperCase()}</DialogTitle>
                  </div>
                  <Badge variant="outline" className="text-white border-white/20 bg-white/10 uppercase text-[10px] font-black px-4 py-1.5 rounded-full">{selectedOrder.status}</Badge>
                </div>
              </DialogHeader>
              
              <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1 bg-white">
                {/* 1. URGENT: Special Instructions */}
                {selectedOrder.specialNote && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <MessageSquareText className="h-3.5 w-3.5" /> Customer's Cooking Note
                    </h4>
                    <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-3xl shadow-sm">
                      <p className="text-sm font-black text-orange-950 uppercase italic tracking-tight leading-relaxed">
                        "{selectedOrder.specialNote}"
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Customer & Delivery Intelligence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"><UserCheck className="h-3 w-3" /> Customer Profile</h4>
                        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-3">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Full Name</p>
                                <p className="text-sm font-black uppercase text-[#333] tracking-tight">{selectedOrder.customerName}</p>
                            </div>
                            <Separator className="bg-gray-200/50" />
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Phone Line</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black tracking-widest text-[#333]">{selectedOrder.customerPhone || "N/A"}</p>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm" onClick={() => window.open(`tel:${selectedOrder.customerPhone}`, '_self')}><Phone className="h-3.5 w-3.5" style={{ color: brandColor }} /></Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"><MapPin className="h-3 w-3" /> Rider Hub</h4>
                        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="text-[8px] font-black uppercase mb-1 bg-white border-gray-200 text-gray-500">{selectedOrder.deliveryAddress?.label || "HOME"}</Badge>
                                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">{selectedOrder.deliveryAddress?.flatNo}, {selectedOrder.deliveryAddress?.area}, {selectedOrder.deliveryAddress?.city}</p>
                                    {selectedOrder.deliveryAddress?.landmark && <p className="text-[9px] font-black mt-1 uppercase text-primary italic">Near: {selectedOrder.deliveryAddress.landmark}</p>}
                                </div>
                                {selectedOrder.deliveryAddress?.latitude && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm shrink-0" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryAddress.latitude},${selectedOrder.deliveryAddress.longitude}`, '_blank')}><Navigation className="h-3.5 w-3.5" style={{ color: brandColor }} /></Button>
                                )}
                            </div>
                            <Button variant="outline" className="w-full h-9 rounded-xl font-black uppercase text-[9px] tracking-widest bg-white border-none shadow-sm gap-2" onClick={() => handleShareLocation(selectedOrder)}><Share2 className="h-3 w-3" style={{ color: brandColor }} /> Share To WhatsApp</Button>
                        </div>
                    </div>
                </div>

                {/* 3. Detailed Order Manifest */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Kitchen Preparation List</h4>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase">{selectedOrder.items.length} SKUs</Badge>
                  </div>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50 transition-all hover:shadow-inner">
                        <div className="flex gap-4">
                          <span className="font-black h-9 w-9 rounded-2xl flex items-center justify-center text-sm shadow-sm" style={{ backgroundColor: brandColor + '15', color: brandColor }}>{item.quantity}x</span>
                          <div className="flex flex-col gap-1.5">
                            <span className="font-black text-[15px] uppercase tracking-tighter text-[#333] italic">{item.name}</span>
                            <div className="flex flex-wrap gap-2">
                                {item.variation && <Badge className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#333] text-white rounded-lg border-none">{item.variation}</Badge>}
                                {item.addons?.map((a, i) => <Badge key={i} variant="outline" className="text-[9px] font-black uppercase px-2 py-0.5 border-dashed rounded-lg" style={{ borderColor: brandColor + '40', color: brandColor }}>+ {a}</Badge>)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                            <span className="font-black text-sm text-[#333]">₹{item.price * item.quantity}</span>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">₹{item.price}/unit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Financial Reconciliation */}
                <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 space-y-4 shadow-inner">
                  <div className="flex justify-between text-[11px] font-black text-muted-foreground uppercase tracking-widest"><span>Net Item Total</span><span>₹{selectedOrder.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[11px] font-black text-muted-foreground uppercase tracking-widest"><span>Applied Taxes (GST)</span><span>₹{selectedOrder.gst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[11px] font-black text-muted-foreground uppercase tracking-widest"><span>Delivery Partner Fee</span><span>₹{selectedOrder.deliveryFee.toFixed(2)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-[11px] font-black text-green-600 uppercase tracking-widest animate-pulse"><span>Promotional Discount</span><span>-₹{selectedOrder.discount.toFixed(2)}</span></div>}
                  <Separator className="bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-black uppercase text-[#333] tracking-tighter italic">Total Amount Collected</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Badge className="bg-green-500/10 text-green-600 border-none text-[9px] font-black uppercase px-2 rounded-sm">PAID: {selectedOrder.paymentMethod || 'Razorpay'}</Badge>
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>
                    <span className="text-3xl font-black tracking-tighter italic" style={{ color: brandColor }}>₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* 5. Loyalty & Customer Retention */}
                <div className="flex items-center gap-4 p-6 rounded-[24px] border border-dashed transition-all" style={{ backgroundColor: brandColor + '05', borderColor: brandColor + '20' }}>
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-[-5deg]" style={{ backgroundColor: brandColor }}>
                        <Crown className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Loyalty Impact</span>
                            <span className="text-[10px] font-black text-muted-foreground">ACE TIER TARGET</span>
                        </div>
                        <p className="text-xs font-bold text-[#333] mt-1 leading-tight uppercase">
                            This customer earned <span className="font-black" style={{ color: brandColor }}>{Math.floor(selectedOrder.subtotal / 100)} Coins</span> on this visit.
                        </p>
                    </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50/80 border-t flex gap-4">
                <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all hover:bg-white active:scale-95">Close Terminal</Button>
                {selectedOrder.status === 'New' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'Preparing')} className="flex-[2] text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95" style={{ backgroundColor: brandColor }}>Activate Prep Pipeline</Button>
                )}
                {selectedOrder.status === 'Preparing' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'Out for Delivery')} className="flex-[2] text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95" style={{ backgroundColor: brandColor }}>Mark as Dispatched</Button>
                )}
                {selectedOrder.status === 'Out for Delivery' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'Completed')} className="flex-[2] text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-green-900/20 transition-all active:scale-95 bg-green-600 hover:bg-green-700">Confirm Delivery</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
