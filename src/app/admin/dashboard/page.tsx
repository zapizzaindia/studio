
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, List, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Order, UserProfile, OutletMenuAvailability } from "@/lib/types";

export default function AdminDashboardPage() {
    const { user } = useUser();
    const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
    const outletId = userProfile?.outletId;
    
    const { data: allOrders, loading: ordersLoading } = useCollection<Order>('orders');
    
    const { data: menuAvailability, loading: availabilityLoading } = useCollection<OutletMenuAvailability>(`outlets/${outletId}/menuAvailability`);


    if (ordersLoading || availabilityLoading) {
        return <p>Loading dashboard data...</p>;
    }
    
    const outletOrders = allOrders?.filter(o => o.outletId === outletId) || [];

    const today = new Date();
    const todaysOrders = outletOrders.filter(o => o.createdAt.toDate().toDateString() === today.toDateString());
    const todaysRevenue = todaysOrders.reduce((sum, order) => order.status === 'Completed' ? sum + order.total : sum, 0);
    const newOrders = outletOrders.filter(o => o.status === 'New');
    const itemsOutOfStock = menuAvailability?.filter(item => !item.isAvailable).length || 0;

    return (
        <div className="container mx-auto p-0">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">A quick overview of your outlet's performance.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{todaysRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{todaysOrders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newOrders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Items Out of Stock</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{itemsOutOfStock}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>A list of the most recent orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outletOrders.slice(0, 5).map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id.substring(0,7)}...</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                                    <TableCell>{order.createdAt.toDate().toLocaleTimeString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'Cancelled' ? 'destructive' : 'secondary'}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
