
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot, BellRing, Volume2, VolumeX, Timer, AlertTriangle, MapPin, Phone, Eye, Package } from 'lucide-react';
import { useAuth, useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  "New": <CircleDot className="h-4 w-4 text-blue-500" />,
  "Preparing": <Loader className="h-4 w-4 text-yellow-500 animate-spin" />,
  "Out for Delivery": <Truck className="h-4 w-4 text-orange-500" />,
  "Completed": <CheckCircle className="h-4 w-4 text-green-500" />,
  "Cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};

const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
const ACCEPTANCE_TIMEOUT_MS = 5 * 60 * 1000;

const OrderTimer = ({ createdAt, orderId, onTimeout }: { createdAt: any, orderId: string, onTimeout: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      const start = createdAt.toMillis();
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
    if (status === 'Cancelled') updateData.paymentStatus = 'Refund Initiated';

    updateDoc(orderRef, updateData).then(() => {
      toast({ title: "Status Updated" });
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    });
  };

  const handleAutoCancel = (orderId: string) => handleUpdateStatus(orderId, 'Cancelled', 'Kitchen Timeout');

  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    if (ordersLoading) return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>;
    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    const sortedOrders = filteredOrders?.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    return (
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Order</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Customer</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Total</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders && sortedOrders.length > 0 ? sortedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-[#14532d]">#{order.id.slice(-6).toUpperCase()}</span>
                        {order.status === 'New' && <OrderTimer createdAt={order.createdAt} orderId={order.id} onTimeout={handleAutoCancel} />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{order.customerName}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {order.deliveryAddress.area}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-xs">₹{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                        {order.status === 'New' && <Button size="sm" className="bg-[#14532d] font-bold text-[10px] uppercase h-8" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>Accept</Button>}
                        {order.status === 'Preparing' && <Button className="bg-orange-500 font-bold text-[10px] uppercase h-8" size="sm" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}>Dispatch</Button>}
                        {order.status === 'Out for Delivery' && <Button className="bg-green-600 font-bold text-[10px] uppercase h-8" size="sm" onClick={() => handleUpdateStatus(order.id, 'Completed')}>Delivered</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground uppercase text-xs font-bold tracking-widest">No active orders</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto p-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="font-headline text-3xl font-bold">Kitchen Pipeline</h1>
            <p className="text-muted-foreground text-xs uppercase font-black tracking-widest flex items-center gap-2 mt-1">
              <span className="text-green-600">● LIVE</span> • {userProfile?.outletId || 'Outlet'}
            </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full h-10 w-10 p-0" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
      
      <Tabs defaultValue="New" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 bg-white p-1 rounded-xl shadow-sm h-12 border">
          {["New", "Preparing", "Out for Delivery", "Completed", "Cancelled", "All"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">
              {tab === "Out for Delivery" ? "Delivery" : tab}
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
        <DialogContent className="max-w-[90vw] rounded-2xl p-0 overflow-hidden border-none">
          {selectedOrder && (
            <div className="flex flex-col">
              <DialogHeader className="p-6 bg-[#14532d] text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-widest flex justify-between items-center">
                  Order #{selectedOrder.id.slice(-6).toUpperCase()}
                  <Badge variant="outline" className="text-white border-white uppercase text-[9px]">{selectedOrder.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Delivery Information</h4>
                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-dashed">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-[#14532d] mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-[#333333] uppercase">{selectedOrder.deliveryAddress.label}</p>
                        <p className="text-[11px] font-bold text-muted-foreground mt-1 leading-tight">
                          {selectedOrder.deliveryAddress.flatNo}, {selectedOrder.deliveryAddress.area}, {selectedOrder.deliveryAddress.city}
                        </p>
                        {selectedOrder.deliveryAddress.landmark && (
                          <p className="text-[10px] font-black text-orange-600 mt-2 uppercase">Landmark: {selectedOrder.deliveryAddress.landmark}</p>
                        )}
                      </div>
                    </div>
                    <Separator className="bg-muted-foreground/10" />
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-[#14532d]" />
                      <p className="text-xs font-black text-[#333333]">{selectedOrder.customerPhone || "Phone not available"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs">
                        <div className="flex gap-2">
                          <span className="font-black text-[#14532d]">{item.quantity}x</span>
                          <span className="font-bold">{item.name} {item.variation ? `(${item.variation})` : ''}</span>
                        </div>
                        <span className="font-black">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Grand Total (Incl. Tax)</span>
                  <span className="text-lg font-black text-[#14532d]">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="p-6 bg-muted/50 border-t flex gap-3">
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1 font-black uppercase text-[10px] h-12">Close</Button>
                {selectedOrder.status === 'New' && <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'Preparing')} className="flex-1 bg-[#14532d] font-black uppercase text-[10px] h-12">Accept Order</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
