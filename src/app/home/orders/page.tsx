
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useUser } from "@/firebase";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const statusIcons: Record<string, React.ReactNode> = {
  "New": <Package className="h-4 w-4 text-blue-500" />,
  "Preparing": <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />,
  "Out for Delivery": <Truck className="h-4 w-4 text-orange-500" />,
  "Completed": <CheckCircle2 className="h-4 w-4 text-green-500" />,
  "Cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: orders, loading } = useCollection<Order>('orders', {
    where: user ? ['customerId', '==', user.uid] : undefined
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f1f2f6]">
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
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black text-[#14532d] uppercase tracking-widest">My Orders</h1>
      </div>

      <div className="p-4 space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-20">
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
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order ID: {order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm font-black text-[#333333] mt-1">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{order.createdAt.toDate().toLocaleDateString()} at {order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={order.status === 'Completed' ? 'secondary' : order.status === 'Cancelled' ? 'destructive' : 'default'}
                    className="uppercase text-[9px] font-black tracking-widest flex gap-1 items-center"
                  >
                    {statusIcons[order.status]}
                    {order.status}
                  </Badge>
                </div>
                <div className="p-4 bg-white flex justify-between items-center">
                  <div className="text-lg font-black text-[#14532d]">
                    {order.total + 48}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedOrder(order)}
                    className="text-[10px] font-black uppercase text-[#14532d] gap-1 pr-0"
                  >
                    VIEW DETAILS <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl p-0 overflow-hidden border-none">
          {selectedOrder && (
            <div className="flex flex-col">
              <DialogHeader className="p-6 bg-[#14532d] text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center justify-between">
                  Order Details
                  <Badge variant="outline" className="text-white border-white text-[10px]">
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1">
                  ID: {selectedOrder.id.toUpperCase()}
                </p>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Your Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className="text-xs font-black text-[#14532d]">{item.quantity}x</span>
                          <span className="text-xs font-bold text-[#333333]">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-[#333333]">{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Bill Breakdown</h4>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Item Total</span>
                      <span>{selectedOrder.total}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span>30</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxes & Charges</span>
                      <span>18</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-[#14532d] pt-2">
                      <span>Grand Total</span>
                      <span>{selectedOrder.total + 48}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f1f2f6] p-4 rounded-xl flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    {statusIcons[selectedOrder.status]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Order Status</p>
                    <p className="text-sm font-black text-[#333333] uppercase italic">{selectedOrder.status}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-[#f1f2f6]/50">
                <Button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
