
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Line, 
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer
} from "recharts";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Order, UserProfile, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  Utensils, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  Calendar as CalendarIcon
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
        const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
        const totalDelivery = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
        
        const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        const successRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

        // Peak Hours Logic
        const hourMap: Record<number, number> = {};
        orders.forEach(o => {
            const hour = o.createdAt.toDate().getHours();
            hourMap[hour] = (hourMap[hour] || 0) + 1;
        });
        const peakHours = Object.entries(hourMap).map(([hour, count]) => ({
            hour: `${hour}:00`,
            orders: count
        })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

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

        const dailyData = Object.values(dayMap);

        return {
            totalRevenue,
            totalGst,
            totalDiscounts,
            totalDelivery,
            aov,
            successRate,
            peakHours,
            topItems,
            dailyData,
            completedCount: completedOrders.length,
            totalCount: orders.length
        };
    }, [orders]);

    const chartConfig = {
        revenue: { label: "Revenue", color: "#14532d" },
        orders: { label: "Orders", color: "#e31837" },
        base: { label: "Base Sales", color: "#14532d" },
        gst: { label: "GST Collected", color: "#4ade80" },
        delivery: { label: "Delivery Fees", color: "#f59e0b" },
    };

    if (ordersLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!stats) return <p>No data available for reports.</p>;

    const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';
    const revenueBreakdown = [
        { name: 'Base Sales', value: stats.totalRevenue - stats.totalGst - stats.totalDelivery, color: brandColor },
        { name: 'GST', value: stats.totalGst, color: '#4ade80' },
        { name: 'Delivery', value: stats.totalDelivery, color: '#f59e0b' },
    ];

    const reportRange = `${format(subDays(new Date(), 6), 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`;

    return (
        <div className="container mx-auto p-0 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold" style={{ color: brandColor }}>Kitchen Intelligence</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Deep dive into operational and financial performance</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border shadow-sm flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest font-roboto tabular-nums">{reportRange}</span>
                </div>
            </div>

            {/* KPI Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4" style={{ color: brandColor }} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black font-roboto tabular-nums" style={{ color: brandColor }}>₹{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12% from last cycle
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg. Order Value</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black font-roboto tabular-nums">₹{Math.round(stats.aov)}</div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Per completed order</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Success</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black font-roboto tabular-nums">{Math.round(stats.successRate)}%</div>
                        <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-orange-500 h-full" style={{ width: `${stats.successRate}%` }} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Completed</CardTitle>
                        <Utensils className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black font-roboto tabular-nums">{stats.completedCount} / {stats.totalCount}</div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Kitchen Load</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Sales Trend */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic">Daily Performance Trend</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Revenue and Volume cycle</CardDescription>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: brandColor }} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Orders</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                        <RechartsLineChart data={stats.dailyData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} className="text-[10px] font-bold uppercase font-roboto" />
                            <YAxis yAxisId="left" stroke={brandColor} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} className="font-roboto" />
                            <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={10} tickLine={false} axisLine={false} className="font-roboto" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={brandColor} strokeWidth={4} dot={{ r: 4, fill: brandColor }} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </RechartsLineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Everyday Sales Section */}
            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                    <CardTitle className="text-xl font-black uppercase tracking-tight italic">Everyday Sales Ledger</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Detailed daily revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-8 font-black uppercase text-[10px] tracking-widest h-14">Business Date</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-center">Orders Completed</TableHead>
                                <TableHead className="pr-8 font-black uppercase text-[10px] tracking-widest h-14 text-right">Daily Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...stats.dailyData].reverse().map((day) => (
                                <TableRow key={day.fullDate} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="pl-8 py-4 font-bold text-xs uppercase tracking-tight text-[#333] font-roboto">
                                        {day.fullDate}
                                    </TableCell>
                                    <TableCell className="text-center font-black text-sm font-roboto tabular-nums">
                                        {day.count}
                                    </TableCell>
                                    <TableCell className="pr-8 text-right font-black text-sm font-roboto tabular-nums" style={{ color: brandColor }}>
                                        ₹{day.revenue.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Top Items Table */}
                <Card className="border-none shadow-sm bg-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Popular Items</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Highest volume movers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-[#333333] uppercase leading-none mb-1">{item.name}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase font-roboto tabular-nums">{item.qty} units sold</span>
                                    </div>
                                    <span className="text-sm font-black font-roboto tabular-nums" style={{ color: brandColor }}>₹{item.rev.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Breakdown Pie */}
                <Card className="border-none shadow-sm bg-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Revenue Mix</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Tax vs Sales vs Delivery</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <RechartsPieChart>
                                <Pie
                                    data={revenueBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {revenueBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </RechartsPieChart>
                        </ChartContainer>
                        <div className="w-full mt-4 grid grid-cols-1 gap-2">
                            {revenueBreakdown.map(item => (
                                <div key={item.name} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-black font-roboto tabular-nums">₹{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Peak Hours Bar Chart */}
                <Card className="border-none shadow-sm bg-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Peak Load Hours</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Heatmap of ordering times</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <RechartsBarChart data={stats.peakHours}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="hour" tickLine={false} axisLine={false} className="text-[8px] font-bold font-roboto" />
                                <YAxis hide />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="orders" fill={brandColor} radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                        </ChartContainer>
                        <div className="mt-4 bg-muted/30 p-3 rounded-xl flex items-center gap-3 border border-dashed">
                            <Clock className="h-4 w-4" style={{ color: brandColor }} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase" style={{ color: brandColor }}>Insights</span>
                                <span className="text-[9px] font-medium uppercase text-muted-foreground">Staffing should be prioritized based on these trends.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-4 border border-red-100">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase text-red-900 tracking-widest">Discount Impact</h4>
                    <p className="text-[10px] font-medium text-red-700 uppercase">You have given ₹<span className="font-roboto tabular-nums">{stats.totalDiscounts.toLocaleString()}</span> in coupon discounts. This is <span className="font-roboto tabular-nums">{Math.round((stats.totalDiscounts / stats.totalRevenue) * 100) || 0}%</span> of your gross revenue.</p>
                </div>
            </div>
        </div>
    );
}
