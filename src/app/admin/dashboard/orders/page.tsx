"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, UserProfile } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot } from 'lucide-react';
import { useAuth, useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  "New": <CircleDot className="h-4 w-4 text-blue-500" />,
  "Preparing": <Loader className="h-4 w-4 text-yellow-500 animate-spin" />,
  "Out for Delivery": <Truck className="h-4 w-4 text-orange-500" />,
  "Completed": <CheckCircle className="h-4 w-4 text-green-500" />,
  "Cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};


export default function AdminOrdersPage() {
  const { user } = useUser();
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  const outletId = userProfile?.outletId;
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', { where: outletId ? ['outletId', '==', outletId] : undefined });
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    
    updateDoc(orderRef, { status })
      .then(() => {
        toast({ title: 'Success', description: `Order status updated to ${status}` });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { status }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    if (ordersLoading) {
      return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>;
    }

    const filteredOrders = statusFilter === 'All' ? orders : orders?.filter(o => o.status === statusFilter);
    const sortedOrders = filteredOrders?.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right min-w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders && sortedOrders.length > 0 ? (
                  sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0,7)}...</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </TableCell>
                    <TableCell>{order.total.toFixed(2)}</TableCell>
                    <TableCell>{order.createdAt.toDate().toLocaleTimeString()}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          {statusIcons[order.status]}
                          <span className="hidden sm:inline">{order.status}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'New' && (
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>Accept</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>Reject</Button>
                        </div>
                      )}
                      {order.status === 'Preparing' && (
                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}>Ready</Button>
                      )}
                      {order.status === 'Out for Delivery' && (
                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'Completed')}>Delivered</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">No orders for this status.</TableCell>
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
      <div className="mb-4">
        <h1 className="font-headline text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Manage incoming orders for your outlet.</p>
      </div>
      
      <Tabs defaultValue="New" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4">
          <TabsTrigger value="New">New</TabsTrigger>
          <TabsTrigger value="Preparing">Preparing</TabsTrigger>
          <TabsTrigger value="Out for Delivery">Delivery</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
          <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="All">All</TabsTrigger>
        </TabsList>
        <TabsContent value="All"><OrderTable statusFilter="All" /></TabsContent>
        <TabsContent value="New"><OrderTable statusFilter="New" /></TabsContent>
        <TabsContent value="Preparing"><OrderTable statusFilter="Preparing" /></TabsContent>
        <TabsContent value="Out for Delivery"><OrderTable statusFilter="Out for Delivery" /></TabsContent>
        <TabsContent value="Completed"><OrderTable statusFilter="Completed" /></TabsContent>
        <TabsContent value="Cancelled"><OrderTable statusFilter="Cancelled" /></TabsContent>
      </Tabs>

    </div>
  );
}
