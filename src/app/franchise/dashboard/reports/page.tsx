
"use client";

import { useState, useMemo } from "react";
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
  ResponsiveContainer,
  Area,
  AreaChart as RechartsAreaChart
} from "recharts";
import { useCollection } from "@/firebase";
import type { City, Order, Outlet, MenuItem, Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  PieChart,
  BarChart3,
  Globe,
  Download,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Filter,
  Package,
  Layers,
  Clock
} from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function FranchiseReportsPage() {
    const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
    const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');
    const { data: menuItems } = useCollection<MenuItem>('menuItems');
    const { data: categories } = useCollection<Category>('categories');

    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [activeBrandFilter, setActiveBrandFilter] = useState<'all' | 'zapizza' | 'zfry'>('all');

    const isLoading = citiesLoading || outletsLoading || ordersLoading;

    const stats = useMemo(() => {
        if (!orders || !outlets || !cities || !menuItems || !categories) return null;

        // Filter orders by date range
        const filteredOrders = orders.filter(o => {
            const date = o.createdAt.toDate();
            return isWithinInterval(date, {
                start: startOfDay(dateRange.from),
                end: endOfDay(dateRange.to)
            });
        });

        const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
        
        // Brand Breakdown
        const brandData = {
            zapizza: { revenue: 0, orders: 0, items: 0, itemsMap: {} as Record<string, number>, catMap: {} as Record<string, number> },
            zfry: { revenue: 0, orders: 0, items: 0, itemsMap: {} as Record<string, number>, catMap: {} as Record<string, number> }
        };

        completedOrders.forEach(o => {
            const outlet = outlets.find(out => out.id === o.outletId);
            const brand = outlet?.brand || 'zapizza';
            brandData[brand].revenue += o.total;
            brandData[brand].orders += 1;

            o.items.forEach(item => {
                brandData[brand].items += item.quantity;
                brandData[brand].itemsMap[item.menuItemId] = (brandData[brand].itemsMap[item.menuItemId] || 0) + item.quantity;
                
                const menuItem = menuItems.find(m => m.id === item.menuItemId);
                if (menuItem) {
                    brandData[brand].catMap[menuItem.category] = (brandData[brand].catMap[menuItem.category] || 0) + (item.price * item.quantity);
                }
            });
        });

        const brandMix = [
            { name: 'Zapizza', value: brandData.zapizza.revenue, color: '#14532d' },
            { name: 'Zfry', value: brandData.zfry.revenue, color: '#e31837' }
        ];

        // Detailed Item Sales
        const itemSales = menuItems.map(item => {
            const qty = (brandData.zapizza.itemsMap[item.id] || 0) + (brandData.zfry.itemsMap[item.id] || 0);
            return {
                id: item.id,
                name: item.name,
                brand: item.brand,
                qty,
                revenue: qty * item.price,
                category: categories.find(c => c.id === item.category)?.name || 'Unknown'
            };
        }).filter(i => i.qty > 0).sort((a, b) => b.revenue - a.revenue);

        // Detailed Category Sales
        const categorySales = categories.map(cat => {
            const rev = (brandData.zapizza.catMap[cat.id] || 0) + (brandData.zfry.catMap[cat.id] || 0);
            return {
                id: cat.id,
                name: cat.name,
                brand: cat.brand,
                revenue: rev
            };
        }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

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
        const daysCount = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i < daysCount; i++) {
            const d = subDays(dateRange.to, i);
            const dateStr = format(d, 'MMM dd');
            dayMap[dateStr] = { date: dateStr, zapizza: 0, zfry: 0 };
        }

        completedOrders.forEach(o => {
            const d = o.createdAt.toDate();
            const dateStr = format(d, 'MMM dd');
            const brand = outlets.find(out => out.id === o.outletId)?.brand || 'zapizza';
            if (dayMap[dateStr]) {
                dayMap[dateStr][brand] += o.total;
            }
        });

        // Peak Hours Comparison
        const hourMap: Record<number, { hour: string, zapizza: number, zfry: number }> = {};
        for(let i=0; i<24; i++) hourMap[i] = { hour: `${i}:00`, zapizza: 0, zfry: 0 };
        
        filteredOrders.forEach(o => {
            const hour = o.createdAt.toDate().getHours();
            const brand = outlets.find(out => out.id === o.outletId)?.brand || 'zapizza';
            hourMap[hour][brand] += 1;
        });

        return {
            totalRevenue,
            brandMix,
            cityPerformance,
            dailyData: Object.values(dayMap).reverse(),
            peakHours: Object.values(hourMap),
            itemSales,
            categorySales,
            totalCompleted: completedOrders.length,
            totalOrders: filteredOrders.length,
            brandData,
            filteredOrders
        };
    }, [orders, outlets, cities, menuItems, categories, dateRange]);

    const handleExportCSV = () => {
        if (!stats?.filteredOrders) return;
        
        const headers = ["Order ID", "Date", "Brand", "Store", "Customer", "Subtotal", "GST", "Delivery", "Discount", "Total", "Status"];
        const rows = stats.filteredOrders.map(o => {
            const outlet = outlets?.find(out => out.id === o.outletId);
            return [
                o.id,
                format(o.createdAt.toDate(), 'yyyy-MM-dd HH:mm'),
                outlet?.brand || 'Zapizza',
                outlet?.name || 'Unknown',
                o.customerName,
                o.subtotal,
                o.gst,
                o.deliveryFee,
                o.discount,
                o.total,
                o.status
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `zapizza_detailed_report_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            </div>
        );
    }

    if (!stats) return <p>No business data available for the selected range.</p>;

    const filteredItemSales = stats.itemSales.filter(i => activeBrandFilter === 'all' || i.brand === activeBrandFilter);
    const filteredCategorySales = stats.categorySales.filter(c => activeBrandFilter === 'all' || c.brand === activeBrandFilter);

    return (
        <div className="container mx-auto p-0 space-y-8 pb-20">
            {/* Super Admin Reporting Header */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-primary">Global Intelligence</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Globe className="h-3 w-3" /> Multi-brand performance audit
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 gap-2", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range: any) => setDateRange(range)}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button onClick={handleExportCSV} className="h-12 rounded-2xl bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest px-6 gap-2 shadow-lg">
                        <Download className="h-4 w-4" /> Export Ledger
                    </Button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <div className="h-1 w-full bg-primary" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Gross Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight italic">₹{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Across {stats.totalCompleted} Completed Orders</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="h-1 w-full bg-blue-500" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global AOV</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight italic">₹{Math.round(stats.totalRevenue / (stats.totalCompleted || 1))}</div>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Avg. value per cart</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="h-1 w-full bg-[#14532d]" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#14532d]">Zapizza Share</CardTitle>
                        <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1">Live</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight italic text-[#14532d]">₹{stats.brandData.zapizza.revenue.toLocaleString()}</div>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">{stats.brandData.zapizza.orders} Total Orders</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="h-1 w-full bg-[#e31837]" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#e31837]">Zfry Share</CardTitle>
                        <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1">Live</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight italic text-[#e31837]">₹{stats.brandData.zfry.revenue.toLocaleString()}</div>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">{stats.brandData.zfry.orders} Total Orders</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Brand Mix Overview */}
                <Card className="border-none shadow-sm bg-white md:col-span-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <PieChart className="h-4 w-4" /> Brand Revenue Mix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-1 py-8">
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
                        <div className="w-full space-y-2 mt-4 px-4">
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

                {/* Multi-Brand Daily Trend Area Chart */}
                <Card className="border-none shadow-sm bg-white md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Growth Pulse
                            </CardTitle>
                            <Badge className="bg-green-100 text-green-800 text-[8px] font-black uppercase border-none">+12% vs LY</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ChartContainer config={chartConfig} className="h-[350px] w-full">
                            <RechartsAreaChart data={stats.dailyData}>
                                <defs>
                                    <linearGradient id="colorZapizza" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14532d" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#14532d" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorZfry" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e31837" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#e31837" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} className="text-[10px] font-bold uppercase" />
                                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Area type="monotone" dataKey="zapizza" stroke="#14532d" strokeWidth={3} fillOpacity={1} fill="url(#colorZapizza)" />
                                <Area type="monotone" dataKey="zfry" stroke="#e31837" strokeWidth={3} fillOpacity={1} fill="url(#colorZfry)" />
                            </RechartsAreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Item Performance Matrix */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
                    <CardHeader className="bg-gray-50/50 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Item Velocity
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase">Volume & Revenue per SKU</CardDescription>
                            </div>
                            <Tabs value={activeBrandFilter} onValueChange={(v: any) => setActiveBrandFilter(v)} className="bg-white rounded-lg p-1 border">
                                <TabsList className="h-8 p-0 bg-transparent">
                                    <TabsTrigger value="all" className="text-[8px] font-black uppercase h-6 rounded-md">All</TabsTrigger>
                                    <TabsTrigger value="zapizza" className="text-[8px] font-black uppercase h-6 rounded-md">Zapizza</TabsTrigger>
                                    <TabsTrigger value="zfry" className="text-[8px] font-black uppercase h-6 rounded-md">Zfry</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest pl-8">Item Name</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-center">Qty</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-right pr-8">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItemSales.map(item => (
                                        <TableRow key={item.id} className="hover:bg-gray-50/50">
                                            <TableCell className="pl-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase tracking-tight text-[#333]">{item.name}</span>
                                                    <span className="text-[8px] font-medium text-muted-foreground uppercase">{item.category}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[7px] font-black uppercase h-4 px-1", item.brand === 'zfry' ? 'border-[#e31837]/30 text-[#e31837]' : 'border-[#14532d]/30 text-[#14532d]')}>
                                                    {item.brand}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-black text-xs">{item.qty}</TableCell>
                                            <TableCell className="text-right pr-8 font-black text-xs">₹{item.revenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
                    <CardHeader className="bg-gray-50/50 pb-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Layers className="h-4 w-4" /> Category Performance
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase">Strategic group contribution</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest pl-8">Category</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Brand</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-right pr-8">Total Sales</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCategorySales.map(cat => (
                                        <TableRow key={cat.id} className="hover:bg-gray-50/50">
                                            <TableCell className="pl-8 py-4">
                                                <span className="text-xs font-bold uppercase tracking-tight text-[#333]">{cat.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[7px] font-black uppercase h-4 px-1", cat.brand === 'zfry' ? 'border-[#e31837]/30 text-[#e31837]' : 'border-[#14532d]/30 text-[#14532d]')}>
                                                    {cat.brand}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8 font-black text-xs">₹{cat.revenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Peak Hours Comparison Chart */}
            <Card className="border-none shadow-sm bg-white rounded-[32px]">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Peak Demand Heatmap
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Volume distribution by hour across brands</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <RechartsBarChart data={stats.peakHours}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="hour" tickLine={false} axisLine={false} className="text-[8px] font-bold" />
                            <YAxis hide />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="zapizza" fill="#14532d" stackId="a" radius={[4, 4, 0, 0]} name="Zapizza Vol" />
                            <Bar dataKey="zfry" fill="#e31837" stackId="a" radius={[4, 4, 0, 0]} name="Zfry Vol" />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Regional Brand Performance */}
            <Card className="border-none shadow-sm bg-white rounded-[32px]">
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
