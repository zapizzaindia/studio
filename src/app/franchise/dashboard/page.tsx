'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Store, Map, Database } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore } from "@/firebase";
import type { City, Outlet, Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, writeBatch, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function FranchiseDashboardPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
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

    const handleSeedData = async () => {
        if (!firestore) return;
        const batch = writeBatch(firestore);

        // 1. Cities
        const mumbaiRef = doc(firestore, 'cities', 'mumbai');
        batch.set(mumbaiRef, { name: 'Mumbai' });

        // 2. Outlets
        const andheriRef = doc(firestore, 'outlets', 'andheri-west');
        batch.set(andheriRef, { 
            name: 'Zapizza Andheri West', 
            cityId: 'mumbai', 
            isOpen: true, 
            openingTime: '11:00', 
            closingTime: '23:00' 
        });

        // 3. Categories
        const vegPizzasRef = doc(firestore, 'categories', 'veg-pizzas');
        batch.set(vegPizzasRef, { name: 'Veg Pizzas', order: 1 });
        const beveragesRef = doc(firestore, 'categories', 'beverages');
        batch.set(beveragesRef, { name: 'Beverages', order: 2 });

        // 4. Menu Items
        const margheritaRef = doc(firestore, 'menuItems', 'margherita');
        batch.set(margheritaRef, {
            name: 'Classic Margherita',
            description: 'Simple and fresh with mozzarella, tomato sauce, and basil.',
            price: 249,
            isVeg: true,
            category: 'veg-pizzas',
            imageId: 'margherita',
            isAvailableGlobally: true
        });

        const cokeRef = doc(firestore, 'menuItems', 'coke');
        batch.set(cokeRef, {
            name: 'Coke (500ml)',
            description: 'Refreshing Coca-Cola.',
            price: 60,
            isVeg: true,
            category: 'beverages',
            imageId: 'coke',
            isAvailableGlobally: true
        });

        try {
            await batch.commit();
            toast({ title: "Success", description: "Demo data seeded successfully!" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to seed data." });
        }
    };

    return (
        <div className="container mx-auto p-0">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Overall business performance overview.</p>
                </div>
                <Button variant="outline" onClick={handleSeedData}>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Demo Data
                </Button>
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