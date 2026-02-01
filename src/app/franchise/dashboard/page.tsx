'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Store, Map } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/firebase";
import type { City, Outlet, Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function FranchiseDashboardPage() {
    const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
    const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');
    
    const isLoading = citiesLoading || outletsLoading || ordersLoading;

    const totalRevenue = orders?.reduce((sum, order) => order.status === 'Completed' ? sum + order.total : sum, 0) || 0;
    const totalOrders = orders?.length || 0;
    const activeOutlets = outlets?.filter(o => o.isOpen).length || 0;
    const totalCities = cities?.length || 0;
    
    const findOutlet = (id: string) => outlets?.find(o => o.id === id);
    const findCity = (id: string) => cities?.find(c => c.id === id);

    const sortedOrders = orders ? [...orders].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()) : [];

    return (
        <div className="container mx-auto p-0">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">Overall business performance overview.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {isLoading ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>}
                        <p className="text-xs text-muted-foreground">All-time revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-bold">{totalOrders}</div>}
                        <p className="text-xs text-muted-foreground">All-time orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Outlets</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-bold">{activeOutlets} / {outlets?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">Across all cities</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
                        <Map className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/4"/> : <div className="text-2xl font-bold">{totalCities}</div>}
                        <p className="text-xs text-muted-foreground">Active regions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Recent Orders</CardTitle>
                    <CardDescription>A list of the most recent orders from all outlets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Outlet</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}><Skeleton className="h-5 w-full"/></TableCell>
                                </TableRow>
                            )) :
                            sortedOrders.slice(0, 10).map((order) => {
                                const outlet = findOutlet(order.outletId);
                                const city = outlet ? findCity(outlet.cityId) : null;
                                return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id.substring(0,7)}...</TableCell>
                                    <TableCell>{outlet?.name || 'N/A'}</TableCell>
                                    <TableCell>{city?.name || 'N/A'}</TableCell>
                                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                                    <TableCell>{order.createdAt.toDate().toLocaleTimeString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'Cancelled' ? 'destructive' : 'secondary'}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
