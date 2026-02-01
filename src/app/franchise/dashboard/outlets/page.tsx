'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { City, Outlet } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

export default function FranchiseOutletsPage() {
  const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
  const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isLoading = outletsLoading || citiesLoading;

  const handleToggleStatus = (outletId: string, currentStatus: boolean) => {
    if (!firestore) return;
    const outletRef = doc(firestore, 'outlets', outletId);
    
    updateDoc(outletRef, { isOpen: !currentStatus })
      .then(() => {
        toast({ title: 'Success', description: 'Outlet status updated.'});
      })
      .catch(error => {
        const permissionError = new FirestorePermissionError({
          path: outletRef.path,
          operation: 'update',
          requestResourceData: { isOpen: !currentStatus }
        });
        errorEmitter.emit('permission-error', permissionError);
      })
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

      {isLoading ? (
        Array.from({length: 2}).map((_, i) => (
            <div key={i} className="mb-8">
                <Skeleton className="h-8 w-32 mb-4" />
                <Card>
                    <CardContent className="p-0">
                        <Skeleton className="w-full h-48" />
                    </CardContent>
                </Card>
            </div>
        ))
      ) : cities?.map(city => {
          const cityOutlets = outlets?.filter(o => o.cityId === city.id);
          if (!cityOutlets || cityOutlets.length === 0) return null;
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
                                                onCheckedChange={() => handleToggleStatus(outlet.id, outlet.isOpen)}
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
