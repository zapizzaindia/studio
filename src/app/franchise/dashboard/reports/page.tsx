
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
import { useCollection } from "@/firebase";
import type { City, Order, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  PieChart,
  BarChart3,
  Globe
} from "lucide-react";

export default function FranchiseReportsPage() {
    const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
    const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');

    const isLoading = citiesLoading || outletsLoading || ordersLoading;

    const stats = useMemo(() => {
        if (!orders || !outlets || !cities) return null;

        const completedOrders = orders.filter(o => o.status === 'Completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
        
        // Brand Breakdown
        const brandData = {
            zapizza: { revenue: 0, orders: 0 },
            zfry: { revenue: 0, orders: 0 }
        };

        completedOrders.forEach(o => {
            const brand = outlets.find(out => out.id === o.outletId)?.brand || 'zapizza';
            brandData[brand].revenue += o.total;
            brandData[brand].orders += 1;
        });

        const brandMix = [
            { name: 'Zapizza', value: brandData.zapizza.revenue, color: '#14532d' },
            { name: 'Zfry', value: brandData.zfry.revenue, color: '#e31837' }
        ];

        // City & Brand Performance
        const cityPerformance = cities.map(city => {
            const cityOutlets = outlets.filter(o => o.cityId === city.id);
            const cityZapizzaOutlets = cityOutlets.filter(o => o.brand === 'zapizza').map(o => o.id);
            const cityZfryOutlets = cityOutlets.filter(o => o.brand === 'zfry').map(o => o.id);

            const zapizzaRev = completedOrders.filter(o => cityZapizzaOutlets.includes(o.outletId)).reduce((sum, o) => sum + o.total, 0);
            const zfryRev = completedOrders.filter(o => cityZfryOutlets.includes(o.outletId)).reduce((sum, o) => sum + o.total, 0);

            return {
                city: city.name,
                zapizza: zapizzaRev,
                zfry: zfryRev,
                total: zapizzaRev + zfryRev
            };
        }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

        // Daily Trend (Aggregated)
        const dayMap: Record<string, { date: string, zapizza: number, zfry: number }> = {};
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).reverse();

        last7Days.forEach(d => dayMap[d] = { date: d, zapizza: 0, zfry: 0 });
        
        completedOrders.forEach(o => {
            const d = o.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const brand = outlets.find(out => out.id === o.outletId)?.brand || 'zapizza';
            if (dayMap[d]) {
                dayMap[d][brand] += o.total;
            }
        });

        return {
            totalRevenue,
            brandMix,
            cityPerformance,
            dailyData: Object.values(dayMap),
            totalCompleted: completedOrders.length
        };
    }, [orders, outlets, cities]);

    const chartConfig = {
        zapizza: { label: "Zapizza", color: "#14532d" },
        zfry: { label: "Zfry", color: "#e31837" },
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-[32px]" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[300px] w-full rounded-[32px]" />
                    <Skeleton className="h-[300px] w-full rounded-[32px]" />
                </div>
            </div>
        );
    }

    if (!stats) return <p>No business data available for global reports.</p>;

    return (
        <div className="container mx-auto p-0 space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-primary">Global Intelligence</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Multi-brand performance audit</p>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Global Load</p>
                        <p className="text-lg font-black text-primary uppercase italic">{stats.totalCompleted} <span className="text-[10px] not-italic opacity-60">Delivered</span></p>
                    </div>
                    <Globe className="h-10 w-10 text-primary opacity-20" />
                </div>
            </div>

            {/* Brand Mix Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-white md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <PieChart className="h-4 w-4" /> Brand Revenue Mix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <RechartsPieChart>
                                <Pie
                                    data={stats.brandMix}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.brandMix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </RechartsPieChart>
                        </ChartContainer>
                        <div className="w-full space-y-2 mt-4">
                            {stats.brandMix.map(brand => (
                                <div key={brand.name} className="flex justify-between items-center p-3 bg-muted/20 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: brand.color }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{brand.name}</span>
                                    </div>
                                    <span className="text-xs font-black">₹{brand.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Multi-Brand Daily Trend */}
                <Card className="border-none shadow-sm bg-white md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Daily Growth Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[350px] w-full">
                            <RechartsLineChart data={stats.dailyData}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} className="text-[10px] font-bold uppercase" />
                                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Line type="monotone" dataKey="zapizza" stroke="#14532d" strokeWidth={4} dot={{ r: 4, fill: '#14532d' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="zfry" stroke="#e31837" strokeWidth={4} dot={{ r: 4, fill: '#e31837' }} activeDot={{ r: 6 }} />
                            </RechartsLineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Regional Brand Performance */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Regional Revenue Breakdown
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Performance of both brands across active cities</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px] w-full">
                        <RechartsBarChart data={stats.cityPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="city" tickLine={false} axisLine={false} className="text-[10px] font-black uppercase tracking-tighter" />
                            <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="zapizza" fill="#14532d" radius={[4, 4, 0, 0]} name="Zapizza" />
                            <Bar dataKey="zfry" fill="#e31837" radius={[4, 4, 0, 0]} name="Zfry" />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
