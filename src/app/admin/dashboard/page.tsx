'use client';

import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, ShoppingBag, List, AlertCircle, LayoutDashboard, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Order, UserProfile, OutletMenuAvailability, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user } = useUser();
    const profileId = user?.email?.toLowerCase().trim() || 'dummy';
    const { data: userProfile } = useDoc<UserProfile>('users', profileId);
    const outletId = userProfile?.outletId || null;
    const { data: outlet } = useDoc<Outlet>('outlets', outletId || 'dummy');
    
    const { data: allOrders, loading: ordersLoading } = useCollection<Order>('orders');
    const { data: menuAvailability, loading: availabilityLoading } = useCollection<OutletMenuAvailability>(`outlets/${outletId}/menuAvailability`);

    if (ordersLoading || availabilityLoading) {
        return (
            <div className="container mx-auto p-0 max-w-2xl space-y-6">
                <Skeleton className="h-20 w-full rounded-[24px]" />
                <div className="grid gap-4 grid-cols-2">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-[32px]" />
            </div>
        );
    }
    
    const outletOrders = allOrders?.filter(o => o.outletId === outletId) || [];
    const today = new Date();
    const todaysOrders = outletOrders.filter(o => o.createdAt.toDate().toDateString() === today.toDateString());
    const todaysRevenue = todaysOrders.reduce((sum, order) => order.status === 'Completed' ? sum + order.total : sum, 0);
    const newOrders = outletOrders.filter(o => o.status === 'New');
    const itemsOutOfStock = menuAvailability?.filter(item => !item.isAvailable).length || 0;

    const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

    return (
        <div className="container mx-auto p-0 max-w-2xl space-y-6">
            <div className="bg-white p-4 rounded-[24px] border shadow-sm flex items-center justify-between">
                <div className="text-left">
                    <h1 className="font-headline text-2xl font-black uppercase tracking-tight italic" style={{ color: brandColor }}>Snapshot</h1>
                    <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-0.5">Kitchen Quick Glance</p>
                </div>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gray-50 shadow-inner ring-1 ring-black/5">
                    <LayoutDashboard className="h-4 w-4" style={{ color: brandColor }} />
                </div>
            </div>
            
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white p-4 rounded-[20px] border border-gray-100 text-left">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Today's Rev</span>
                        <IndianRupee className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-black font-roboto tabular-nums" style={{ color: brandColor }}>₹{todaysRevenue.toFixed(0)}</div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-4 rounded-[20px] border border-gray-100 text-left">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Orders</span>
                        <ShoppingBag className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-black font-roboto tabular-nums">+{todaysOrders.length}</div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-4 rounded-[20px] border border-gray-100 text-left cursor-pointer active:scale-95 transition-all" onClick={() => router.push('/admin/dashboard/orders')}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Awaiting</span>
                        <List className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-black font-roboto tabular-nums text-orange-600">{newOrders.length} New</div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-4 rounded-[20px] border border-gray-100 text-left cursor-pointer active:scale-95 transition-all" onClick={() => router.push('/admin/dashboard/menu')}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Stock Alert</span>
                        <AlertCircle className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-black font-roboto tabular-nums text-red-500">{itemsOutOfStock} Out</div>
                </Card>
            </div>

            <Card className="border-none shadow-sm rounded-[24px] overflow-hidden bg-white border border-gray-100">
                <div className="bg-gray-50/50 p-4 border-b flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest">Recent Activity</h3>
                    <Button variant="ghost" className="h-6 text-[8px] font-black uppercase tracking-widest p-0 flex items-center gap-1" onClick={() => router.push('/admin/dashboard/orders')}>
                        Full Feed <ChevronRight className="h-2 w-2" />
                    </Button>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-4 font-black uppercase text-[8px] tracking-widest h-10">ID</TableHead>
                                <TableHead className="font-black uppercase text-[8px] tracking-widest h-10">Customer</TableHead>
                                <TableHead className="pr-4 font-black uppercase text-[8px] tracking-widest h-10 text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outletOrders.slice(0, 5).map((order) => (
                                <TableRow key={order.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="pl-4 py-3 font-black text-[10px] tracking-widest text-primary uppercase font-roboto">#{order.id.substring(0,6).toUpperCase()}</TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col text-left">
                                            <span className="font-black text-[11px] uppercase text-[#333] leading-none">{order.customerName}</span>
                                            <Badge variant="outline" className="w-fit text-[6px] h-3 px-1 mt-1 font-black uppercase border-gray-200 text-muted-foreground">{order.status}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-4 py-3 text-right font-black text-[11px] font-sans tabular-nums">₹{order.total.toFixed(0)}</TableCell>
                                </TableRow>
                            ))}
                            {outletOrders.length === 0 && (
                                <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic text-[10px] uppercase font-black opacity-40">No orders logged yet</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
