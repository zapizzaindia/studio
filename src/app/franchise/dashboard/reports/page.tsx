"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, Line, LineChart as RechartsLineChart } from "recharts"
import { useCollection } from "@/firebase";
import type { City, Order, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function FranchiseReportsPage() {
    const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
    const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');

    const isLoading = citiesLoading || outletsLoading || ordersLoading;

    const chartConfig = {
        revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
        orders: { label: "Orders", color: "hsl(var(--chart-2))" }
    }
    
    const cityPerformance = cities?.map(city => {
        const cityOutlets = outlets?.filter(o => o.cityId === city.id).map(o => o.id);
        const cityOrders = orders?.filter(o => cityOutlets?.includes(o.outletId));
        const cityRevenue = cityOrders?.reduce((sum, o) => o.status === 'Completed' ? sum + o.total : sum, 0) || 0;
        return {
            city: city.name,
            revenue: cityRevenue,
            orders: cityOrders?.length || 0
        }
    }).filter(c => c.revenue > 0 || c.orders > 0) || [];


    return (
        <div className="container mx-auto p-0">
            <div className="mb-4">
                <h1 className="font-headline text-3xl font-bold">Global Reports</h1>
                <p className="text-muted-foreground">Analyze performance across all cities and outlets.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by City</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <RechartsBarChart data={cityPerformance}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="city" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Orders by City</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <RechartsLineChart data={cityPerformance}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="city" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                            </RechartsLineChart>
                        </ChartContainer>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
