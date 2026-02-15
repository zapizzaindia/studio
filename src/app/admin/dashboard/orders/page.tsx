
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot, BellRing, Volume2, VolumeX, Timer, AlertTriangle } from 'lucide-react';
import { useAuth, useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  "New": <CircleDot className="h-4 w-4 text-blue-500" />,
  "Preparing": <Loader className="h-4 w-4 text-yellow-500 animate-spin" />,
  "Out for Delivery": <Truck className="h-4 w-4 text-orange-500" />,
  "Completed": <CheckCircle className="h-4 w-4 text-green-500" />,
  "Cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};

const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
const ACCEPTANCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minutes

// Internal Countdown Component for New Orders
const OrderTimer = ({ createdAt, orderId, onTimeout }: { createdAt: any, orderId: string, onTimeout: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      const start = createdAt.toMillis();
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, ACCEPTANCE_TIMEOUT_MS - elapsed);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        onTimeout(orderId);
      }
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
  const prevNewOrdersCount = useRef<number>(0);

  // Sound Notification Logic
  useEffect(() => {
    if (!orders || ordersLoading) return;

    const newOrders = orders.filter(o => o.status === 'New');
    const currentCount = newOrders.length;

    if (currentCount > prevNewOrdersCount.current) {
      if (!isMuted) {
        const audio = new Audio(ALERT_SOUND_URL);
        audio.play().catch(e => console.log("Autoplay blocked or audio failed", e));
      }
      
      toast({
        title: "NEW ORDER RECEIVED!",
        description: `Order #${newOrders[0].id.substring(0,7).toUpperCase()} is waiting for acceptance.`,
        variant: "default",
      });
    }

    prevNewOrdersCount.current = currentCount;
  }, [orders, ordersLoading, isMuted, toast]);

  const handleUpdateStatus = (orderId: string, status: OrderStatus, reason?: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    
    const updateData: any = { status };
    if (reason) updateData.cancellationReason = reason;
    if (status === 'Cancelled') updateData.paymentStatus = 'Refund Initiated';

    updateDoc(orderRef, updateData)
      .then(() => {
        toast({ 
          title: status === 'Cancelled' ? 'Order Cancelled' : 'Success', 
          description: status === 'Cancelled' ? `Order #${orderId.substring(0,7)} timed out. Refund processed.` : `Order status updated to ${status}` 
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: updateData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleAutoCancel = (orderId: string) => {
    handleUpdateStatus(orderId, 'Cancelled', 'Auto-cancelled: Kitchen Timeout');
  };
  
  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    if (ordersLoading) {
      return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>;
    }

    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    const sortedOrders = filteredOrders?.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    return (
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Order ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Customer</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Items</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Total</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Time</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right min-w-[140px] font-bold text-xs uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders && sortedOrders.length > 0 ? (
                  sortedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-[#14532d]">#{order.id.substring(0,7).toUpperCase()}</span>
                        {order.status === 'New' && (
                          <OrderTimer createdAt={order.createdAt} orderId={order.id} onTimeout={handleAutoCancel} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-black">₹{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground">{order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          {statusIcons[order.status]}
                          <div className="flex flex-col items-start">
                            <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest py-0 ${order.status === 'Cancelled' ? 'border-red-200 text-red-600 bg-red-50' : ''}`}>
                              {order.status}
                            </Badge>
                            {(order as any).paymentStatus === 'Refund Initiated' && (
                              <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Refunded</span>
                            )}
                          </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'New' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" className="bg-[#14532d] hover:bg-[#0f4023] font-bold text-[10px] uppercase h-8" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>Accept</Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50 font-bold text-[10px] uppercase h-8" onClick={() => handleUpdateStatus(order.id, 'Cancelled', 'Rejected by Outlet')}>Reject</Button>
                        </div>
                      )}
                      {order.status === 'Preparing' && (
                        <Button className="bg-orange-500 hover:bg-orange-600 font-bold text-[10px] uppercase h-8" size="sm" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}>Dispatch</Button>
                      )}
                      {order.status === 'Out for Delivery' && (
                        <Button className="bg-green-600 hover:bg-green-700 font-bold text-[10px] uppercase h-8" size="sm" onClick={() => handleUpdateStatus(order.id, 'Completed')}>Mark Delivered</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic uppercase text-xs font-bold tracking-widest">No active orders in this queue</TableCell>
                  </TableRow>
                )}
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
            <div className="flex items-center gap-2 mb-1">
                <BellRing className="h-5 w-5 text-[#14532d]" />
                <h1 className="font-headline text-3xl font-bold">Kitchen Pipeline</h1>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              Managing live orders for <span className="font-black text-[#14532d] uppercase tracking-widest text-[10px]">{userProfile?.outletId || 'Local Outlet'}</span>
              <span className="text-[10px] text-orange-600 font-black uppercase flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> 5m Acceptance Window Active
              </span>
            </p>
        </div>
        <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full h-10 w-10 p-0 border-[#14532d]/20 text-[#14532d]"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">System Online</span>
            </div>
        </div>
      </div>
      
      <Tabs defaultValue="New" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 bg-white p-1 rounded-xl shadow-sm h-14 border">
          <TabsTrigger value="New" className="relative font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">
            New Orders
            {orders?.filter(o => o.status === 'New').length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white animate-bounce">
                {orders.filter(o => o.status === 'New').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="Preparing" className="font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">Preparing</TabsTrigger>
          <TabsTrigger value="Out for Delivery" className="font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">Delivery</TabsTrigger>
          <TabsTrigger value="Completed" className="font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">Done</TabsTrigger>
          <TabsTrigger value="Cancelled" className="font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">Cancelled</TabsTrigger>
          <TabsTrigger value="All" className="font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-[#14532d] data-[state=active]:text-white">View All</TabsTrigger>
        </TabsList>
        <TabsContent value="All" className="mt-0"><OrderTable statusFilter="All" /></TabsContent>
        <TabsContent value="New" className="mt-0"><OrderTable statusFilter="New" /></TabsContent>
        <TabsContent value="Preparing" className="mt-0"><OrderTable statusFilter="Preparing" /></TabsContent>
        <TabsContent value="Out for Delivery" className="mt-0"><OrderTable statusFilter="Out for Delivery" /></TabsContent>
        <TabsContent value="Completed" className="mt-0"><OrderTable statusFilter="Completed" /></TabsContent>
        <TabsContent value="Cancelled" className="mt-0"><OrderTable statusFilter="Cancelled" /></TabsContent>
      </Tabs>

    </div>
  );
}
