"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useUser } from "@/firebase";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: orders, loading } = useCollection<Order>('orders', {
    where: user ? ['customerId', '==', user.uid] : undefined
  });

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
                    className="uppercase text-[9px] font-black tracking-widest"
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="p-4 bg-white flex justify-between items-center">
                  <div className="text-lg font-black text-[#14532d]">
                    {order.total + 48}
                  </div>
                  <Button variant="ghost" className="text-[10px] font-black uppercase text-[#14532d] gap-1 pr-0">
                    VIEW DETAILS <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
