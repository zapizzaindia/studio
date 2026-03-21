
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Line, 
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Order, UserProfile, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  AlertCircle,
  Calendar as CalendarIcon,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminReportsPage() {
    const { user } = useUser();
    const profileId = user?.email?.toLowerCase().trim() || 'dummy';
    const { data: userProfile } = useDoc<UserProfile>('users', profileId);
    const outletId = userProfile?.outletId;
    const { data: outlet } = useDoc<Outlet>('outlets', outletId || 'dummy');
    
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', { 
        where: outletId ? ['outletId', '==', outletId] : undefined 
    });

    const stats = useMemo(() => {
        if (!orders) return null;

        const completedOrders = orders.filter(o => o.status === 'Completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
        const totalGst = completedOrders.reduce((sum, o) => sum + (o.gst || 0), 0);
        const totalDelivery = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
        const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
        
        const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        const successRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

        // Top Items Logic
        const itemMap: Record<string, { name: string, qty: number, rev: number }> = {};
        completedOrders.forEach(o => {
            o.items.forEach(item => {
                if (!itemMap[item.menuItemId]) {
                    itemMap[item.menuItemId] = { name: item.name, qty: 0, rev: 0 };
                }
                itemMap[item.menuItemId].qty += item.quantity;
                itemMap[item.menuItemId].rev += (item.price * item.quantity);
            });
        });
        const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

        // Daily Revenue Logic (Last 7 Days)
        const dayMap: Record<string, { date: string, fullDate: string, revenue: number, count: number }> = {};
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), i);
            return {
                label: format(d, 'MMM dd'),
                full: format(d, 'do MMM yyyy')
            };
        }).reverse();

        last7Days.forEach(d => dayMap[d.label] = { date: d.label, fullDate: d.full, revenue: 0, count: 0 });
        
        completedOrders.forEach(o => {
            const d = format(o.createdAt.toDate(), 'MMM dd');
            if (dayMap[d]) {
                dayMap[d].revenue += o.total;
                dayMap[d].count += 1;
            }
        });

        return {
            totalRevenue,
            totalGst,
            totalDelivery,
            totalDiscounts,
            aov,
            successRate,
            topItems,
            dailyData: Object.values(dayMap),
            completedCount: completedOrders.length,
            totalCount: orders.length
        };
    }, [orders]);

    const chartConfig = {
        revenue: { label: "Revenue", color: "#14532d" },
        orders: { label: "Orders", color: "#e31837" },
    };

    if (ordersLoading) {
        return (
            <div className="container mx-auto p-0 max-w-2xl space-y-4">
                <Skeleton className="h-20 w-full rounded-[24px]" />
                <div className="grid gap-3 grid-cols-2">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-[24px]" />
            </div>
        );
    }

    if (!stats) return <p>No data available for reports.</p>;

    const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';
    const revenueBreakdown = [
        { name: 'Base', value: Math.max(0, stats.totalRevenue - stats.totalGst - stats.totalDelivery), color: brandColor },
        { name: 'Tax', value: stats.totalGst, color: '#4ade80' },
        { name: 'Logistics', value: stats.totalDelivery, color: '#f59e0b' },
    ];

    const reportRange = `${format(subDays(new Date(), 6), 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`;

    return (
        <div className="container mx-auto p-0 max-w-2xl space-y-4 overflow-x-hidden">
            <div className="bg-white p-4 rounded-[24px] border shadow-sm flex items-center justify-between">
                <div className="text-left text-ellipsis overflow-hidden pr-2">
                    <h1 className="font-headline text-2xl font-black uppercase tracking-tight italic truncate" style={{ color: brandColor }}>Intelligence</h1>
                    <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarIcon className="h-2 w-2" /> {reportRange}
                    </p>
                </div>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gray-50 shadow-inner ring-1 ring-black/5 shrink-0">
                    <BarChart3 className="h-4 w-4" style={{ color: brandColor }} />
                </div>
            </div>

            {/* KPI Overview */}
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white p-3 rounded-[20px] border border-gray-100 text-left">
                    <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground mb-1">Gross Rev</p>
                    <div className="text-sm font-black font-roboto tabular-nums" style={{ color: brandColor }}>₹{stats.totalRevenue.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-[6px] font-bold text-green-600 mt-1 uppercase">
                        <TrendingUp className="h-1.5 w-1.5" /> Growth Trend
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-3 rounded-[20px] border border-gray-100 text-left">
                    <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground mb-1">Avg Order</p>
                    <div className="text-sm font-black font-roboto tabular-nums text-[#333]">₹{Math.round(stats.aov)}</div>
                    <p className="text-[6px] font-bold text-muted-foreground mt-1 uppercase">Per Cart</p>
                </Card>
                <Card className="border-none shadow-sm bg-white p-3 rounded-[20px] border border-gray-100 text-left">
                    <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground mb-1">Accuracy</p>
                    <div className="text-sm font-black font-roboto tabular-nums text-orange-600">{Math.round(stats.successRate)}%</div>
                    <div className="w-full bg-gray-100 h-0.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{ width: `${stats.successRate}%` }} />
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-3 rounded-[20px] border border-gray-100 text-left">
                    <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground mb-1">Volume</p>
                    <div className="text-sm font-black font-roboto tabular-nums text-[#333]">{stats.completedCount} Done</div>
                    <p className="text-[6px] font-bold text-muted-foreground mt-1 uppercase">Kitchen Load</p>
                </Card>
            </div>

            {/* Main Trend */}
            <Card className="border-none shadow-sm bg-white rounded-[24px] overflow-hidden border border-gray-100">
                <CardHeader className="p-4 pb-0 text-left">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Growth Pulse</CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                                <span className="text-[7px] font-black uppercase">Rev</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                <span className="text-[7px] font-black uppercase">Vol</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-2 pt-4">
                    <ChartContainer config={chartConfig} className="h-[180px] w-full">
                        <RechartsLineChart data={stats.dailyData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={5} className="text-[7px] font-bold uppercase font-roboto" />
                            <YAxis yAxisId="left" stroke={brandColor} fontSize={7} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} className="font-roboto" />
                            <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={7} tickLine={false} axisLine={false} className="font-roboto" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={brandColor} strokeWidth={2.5} dot={{ r: 2, fill: brandColor }} />
                            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                        </RechartsLineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {/* Popular Items */}
                <Card className="border-none shadow-sm bg-white rounded-[24px] border border-gray-100 p-4 text-left">
                    <h4 className="text-[9px] font-black uppercase tracking-widest mb-3">Popular Items</h4>
                    <div className="space-y-2">
                        {stats.topItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100/50">
                                <div className="flex flex-col text-left min-w-0 pr-2">
                                    <span className="text-[10px] font-black text-[#333] uppercase leading-tight truncate">{item.name}</span>
                                    <span className="text-[7px] font-bold text-muted-foreground uppercase mt-0.5">{item.qty} units</span>
                                </div>
                                <span className="text-[10px] font-black font-roboto tabular-nums shrink-0" style={{ color: brandColor }}>₹{item.rev.toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* revenue Mix */}
                <Card className="border-none shadow-sm bg-white rounded-[24px] border border-gray-100 p-4 flex flex-col items-center text-left">
                    <h4 className="text-[9px] font-black uppercase tracking-widest mb-3 w-full">Revenue Mix</h4>
                    <div className="h-[100px] w-full">
                        <ChartContainer config={{}} className="h-full w-full">
                            <RechartsPieChart>
                                <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                                    {revenueBreakdown.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </RechartsPieChart>
                        </ChartContainer>
                    </div>
                    <div className="w-full mt-2 space-y-1">
                        {revenueBreakdown.map(item => (
                            <div key={item.name} className="flex justify-between text-[7px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div>
                                <span className="font-roboto tabular-nums">₹{item.value.toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Sales Ledger */}
            <Card className="border-none shadow-sm rounded-[24px] overflow-hidden bg-white border border-gray-100">
                <div className="bg-gray-50/50 p-3 border-b text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-widest">Daily Ledger</h3>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-gray-100">
                                <TableHead className="pl-4 font-black uppercase text-[8px] tracking-widest h-10">Date</TableHead>
                                <TableHead className="font-black uppercase text-[8px] tracking-widest h-10 text-center">Vol</TableHead>
                                <TableHead className="pr-4 font-black uppercase text-[8px] tracking-widest h-10 text-right">Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...stats.dailyData].reverse().map((day) => (
                                <TableRow key={day.fullDate} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="pl-4 py-2.5 font-bold text-[9px] uppercase text-[#333] font-roboto">
                                        {day.fullDate}
                                    </TableCell>
                                    <TableCell className="text-center font-black text-[10px] font-roboto tabular-nums">
                                        {day.count}
                                    </TableCell>
                                    <TableCell className="pr-4 text-right font-black text-[10px] font-roboto tabular-nums" style={{ color: brandColor }}>
                                        ₹{day.revenue.toFixed(0)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-orange-50 p-4 rounded-[20px] flex items-start gap-3 border border-orange-100 text-left mb-12">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                <div>
                    <h4 className="text-[9px] font-black uppercase text-orange-900 tracking-widest">Efficiency Note</h4>
                    <p className="text-[8px] font-medium text-orange-700 uppercase leading-relaxed mt-1">
                        Discounts of ₹<span className="font-roboto tabular-nums">{stats.totalDiscounts.toLocaleString()}</span> recorded. Track campaign efficacy against volume spikes.
                    </p>
                </div>
            </div>
        </div>
    );
}
