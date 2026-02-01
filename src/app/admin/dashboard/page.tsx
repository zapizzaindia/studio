"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ORDERS } from '@/lib/data';
import type { Order, OrderStatus } from '@/lib/types';
import { Truck, CheckCircle, XCircle, Loader, CircleDot } from 'lucide-react';

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  "New": <CircleDot className="h-4 w-4 text-blue-500" />,
  "Preparing": <Loader className="h-4 w-4 text-yellow-500 animate-spin" />,
  "Out for Delivery": <Truck className="h-4 w-4 text-orange-500" />,
  "Completed": <CheckCircle className="h-4 w-4 text-green-500" />,
  "Cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};


export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === orderId ? { ...o, status } : o)
    );
  };

  const OrderTable = ({ statusFilter }: { statusFilter: OrderStatus | 'All' }) => {
    const filteredOrders = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);
    
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
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
                    </TableCell>
                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'p')}</TableCell>
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
    <div className="container mx-auto p-4">
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
