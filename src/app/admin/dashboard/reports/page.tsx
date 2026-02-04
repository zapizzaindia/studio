"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, Line, LineChart as RechartsLineChart } from "recharts"

const salesData = [
    { date: 'Jul 23', revenue: 2300 },
    { date: 'Jul 24', revenue: 2500 },
    { date: 'Jul 25', revenue: 2800 },
    { date: 'Jul 26', revenue: 2600 },
    { date: 'Jul 27', revenue: 3100 },
    { date: 'Jul 28', revenue: 3300 },
    { date: 'Jul 29', revenue: 3500 },
];

const ordersData = [
    { date: 'Jul 23', orders: 20 },
    { date: 'Jul 24', orders: 22 },
    { date: 'Jul 25', orders: 25 },
    { date: 'Jul 26', orders: 24 },
    { date: 'Jul 27', orders: 28 },
    { date: 'Jul 28', orders: 30 },
    { date: 'Jul 29', orders: 32 },
];


export default function AdminReportsPage() {
    const chartConfig = {
        revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
        orders: { label: "Orders", color: "hsl(var(--chart-2))" }
    }

    return (
        <div className="container mx-auto p-0">
            <div className="mb-4">
                <h1 className="font-headline text-3xl font-bold">Reports</h1>
                <p className="text-muted-foreground">Analyze your outlet's performance.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <RechartsBarChart data={salesData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daily Orders (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <RechartsLineChart data={ordersData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                            </RechartsLineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
