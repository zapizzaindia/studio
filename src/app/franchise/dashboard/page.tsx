
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, ShoppingBag, Store, Map, Pizza, Flame } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/firebase";
import type { City, Outlet, Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function FranchiseDashboardPage() {
    const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
    const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');
    
    const isLoading = citiesLoading || outletsLoading || ordersLoading;

    const findOutlet = (id: string) => outlets?.find(o => o.id === id);
    const findCity = (id: string) => cities?.find(c => c.id === id);

    const stats = useMemo(() => {
        if (!orders || !outlets) return null;

        const totalRevenue = orders.reduce((sum, order) => order.status === 'Completed' ? sum + order.total : sum, 0);
        
        const zapizzaOrders = orders.filter(o => findOutlet(o.outletId)?.brand === 'zapizza');
        const zfryOrders = orders.filter(o => findOutlet(o.outletId)?.brand === 'zfry');

        const zapizzaRevenue = zapizzaOrders.reduce((sum, o) => o.status === 'Completed' ? sum + o.total : sum, 0);
        const zfryRevenue = zfryOrders.reduce((sum, o) => o.status === 'Completed' ? sum + o.total : sum, 0);

        return {
            totalRevenue,
            totalOrders: orders.length,
            zapizza: { revenue: zapizzaRevenue, orders: zapizzaOrders.length },
            zfry: { revenue: zfryRevenue, orders: zfryOrders.length }
        };
    }, [orders, outlets]);

    const activeOutlets = outlets?.filter(o => o.isOpen).length || 0;
    const totalCities = cities?.length || 0;
    const sortedOrders = orders ? [...orders].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()) : [];

    return (
        <div className="container mx-auto p-0 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Global business health across all brands and regions.</p>
                </div>
            </div>
            
            {/* KPI Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                       {isLoading ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-black">₹{stats?.totalRevenue.toLocaleString()}</div>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-black">{stats?.totalOrders}</div>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Outlets</CardTitle>
                        <Store className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-black">{activeOutlets} / {outlets?.length || 0}</div>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Cities</CardTitle>
                        <Map className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/4"/> : <div className="text-2xl font-black">{totalCities}</div>}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Brand Performance Card */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Brand Performance</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">Revenue breakdown by brand</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#14532d]/5 rounded-2xl border border-[#14532d]/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#14532d] flex items-center justify-center text-white">
                                    <Pizza className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#14532d]">Zapizza</p>
                                    <p className="text-lg font-black tracking-tight">₹{stats?.zapizza.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="font-black text-[10px] uppercase">{stats?.zapizza.orders} Orders</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#e31837]/5 rounded-2xl border border-[#e31837]/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#e31837] flex items-center justify-center text-white">
                                    <Flame className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#e31837]">Zfry</p>
                                    <p className="text-lg font-black tracking-tight">₹{stats?.zfry.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="font-black text-[10px] uppercase">{stats?.zfry.orders} Orders</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Global Activity */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Global Activity</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">Latest transactions across all stores</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {isLoading ? Array.from({length: 4}).map((_, i) => (
                                    <TableRow key={i}><TableCell><Skeleton className="h-4 w-full"/></TableCell></TableRow>
                                )) :
                                sortedOrders.slice(0, 4).map((order) => {
                                    const outlet = findOutlet(order.outletId);
                                    return (
                                    <TableRow key={order.id} className="hover:bg-transparent">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${outlet?.brand === 'zfry' ? 'bg-[#e31837]' : 'bg-[#14532d]'}`} />
                                                <div>
                                                    <p className="text-xs font-black uppercase text-[#333] tracking-tight">{outlet?.name || 'N/A'}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{order.createdAt.toDate().toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-xs font-black">₹{order.total.toFixed(2)}</p>
                                            <p className={`text-[8px] font-black uppercase ${order.status === 'Cancelled' ? 'text-red-500' : 'text-green-600'}`}>{order.status}</p>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tight italic">All Recent Orders</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Master order ledger</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b-gray-100 hover:bg-transparent">
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pl-8">Order ID</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Store & Brand</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">City</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Total</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Time</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} className="py-4 pl-8"><Skeleton className="h-5 w-full"/></TableCell>
                                </TableRow>
                            )) :
                            sortedOrders.slice(0, 10).map((order) => {
                                const outlet = findOutlet(order.outletId);
                                const city = outlet ? findCity(outlet.cityId) : null;
                                return (
                                <TableRow key={order.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="font-black text-xs pl-8 tracking-widest text-primary uppercase">#{order.id.substring(0,7)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] uppercase text-[#333] tracking-tight">{outlet?.name || 'N/A'}</span>
                                            <Badge variant="outline" className={`w-fit text-[7px] font-black uppercase h-4 px-1 ${outlet?.brand === 'zfry' ? 'border-[#e31837]/30 text-[#e31837]' : 'border-[#14532d]/30 text-[#14532d]'}`}>
                                                {outlet?.brand || 'Zapizza'}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">{city?.name || 'N/A'}</TableCell>
                                    <TableCell className="font-black text-xs text-[#333]">₹{order.total.toFixed(2)}</TableCell>
                                    <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">{order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Badge variant={order.status === 'Cancelled' ? 'destructive' : 'secondary'} className="text-[8px] font-black uppercase">
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
