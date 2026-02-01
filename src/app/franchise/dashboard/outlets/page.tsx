'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CITIES, OUTLETS } from '@/lib/data';
import type { Outlet } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function FranchiseOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);

  const handleToggleStatus = (outletId: string) => {
    setOutlets(prevOutlets => 
      prevOutlets.map(o => 
        o.id === outletId ? { ...o, isOpen: !o.isOpen } : o
      )
    );
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">Outlet Management</h1>
          <p className="text-muted-foreground">Manage all outlets across all cities.</p>
        </div>
        <div className="flex gap-2">
            <Button><Plus/> Add Outlet</Button>
            <Button variant="outline"><Plus/> Add City</Button>
        </div>
      </div>

      {CITIES.map(city => {
          const cityOutlets = outlets.filter(o => o.cityId === city.id);
          if (cityOutlets.length === 0) return null;
          return (
            <div key={city.id} className="mb-8">
                <h2 className="font-headline text-2xl font-bold mb-4">{city.name}</h2>
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Outlet Name</TableHead>
                                    <TableHead>Outlet ID</TableHead>
                                    <TableHead className="text-right">Status (Accepting Orders)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cityOutlets.map(outlet => (
                                    <TableRow key={outlet.id}>
                                        <TableCell className="font-medium">{outlet.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{outlet.id}</TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={outlet.isOpen}
                                                onCheckedChange={() => handleToggleStatus(outlet.id)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
      )})}
    </div>
  );
}
