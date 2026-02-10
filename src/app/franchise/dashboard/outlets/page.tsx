
'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { City, Outlet } from '@/lib/types';
import { Plus, MapPin, Store } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function FranchiseOutletsPage() {
  const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
  const { data: cities, loading: citiesLoading } = useCollection<City>('cities');
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [isOutletDialogOpen, setIsOutletDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newOutletName, setNewOutletName] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  const isLoading = outletsLoading || citiesLoading;

  const handleAddCity = async () => {
    if (!newCityName) return;
    
    // UI Mock for Demo Mode
    toast({ title: "City added successfully (Demo Mode)", description: `New city "${newCityName}" added to regional list.` });
    setNewCityName("");
    setIsCityDialogOpen(false);

    // In production, firestore write would happen here:
    /*
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'cities'), { name: newCityName });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error adding city" });
    }
    */
  };

  const handleAddOutlet = async () => {
    if (!newOutletName || !selectedCityId) return;

    // UI Mock for Demo Mode
    toast({ title: "Outlet added successfully (Demo Mode)", description: `"${newOutletName}" has been established.` });
    setNewOutletName("");
    setSelectedCityId("");
    setIsOutletDialogOpen(false);

    // In production, firestore write would happen here:
    /*
    if (!firestore) return;
    const outletData = {
      name: newOutletName,
      cityId: selectedCityId,
      isOpen: true,
      openingTime: "11:00",
      closingTime: "23:00"
    };
    try {
      await addDoc(collection(firestore, 'outlets'), outletData);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error adding outlet" });
    }
    */
  };

  const handleToggleStatus = (outletId: string, currentStatus: boolean) => {
    toast({ title: 'Status updated (Demo Mode)', description: 'Outlet operations status changed.' });

    // In production:
    /*
    if (!firestore) return;
    const outletRef = doc(firestore, 'outlets', outletId);
    updateDoc(outletRef, { isOpen: !currentStatus })
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: outletRef.path,
          operation: 'update',
          requestResourceData: { isOpen: !currentStatus }
        }));
      })
    */
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Outlet Management</h1>
          <p className="text-muted-foreground">Manage all outlets and regions across India.</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isOutletDialogOpen} onOpenChange={setIsOutletDialogOpen}>
                <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4"/> Add Outlet</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Outlet</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Outlet Name</Label>
                            <Input placeholder="e.g. Zapizza Bandra" value={newOutletName} onChange={e => setNewOutletName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Select onValueChange={setSelectedCityId} value={selectedCityId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities?.map(city => (
                                        <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddOutlet} disabled={!newOutletName || !selectedCityId}>Create Outlet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Plus className="mr-2 h-4 w-4"/> Add City</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New City</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>City Name</Label>
                            <Input placeholder="e.g. Pune" value={newCityName} onChange={e => setNewCityName(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddCity} disabled={!newCityName}>Add City</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
          return (
            <div key={city.id} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="font-headline text-2xl font-bold">{city.name}</h2>
                </div>
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Outlet Name</TableHead>
                                    <TableHead>Location Details</TableHead>
                                    <TableHead className="text-right">Accepting Orders</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cityOutlets && cityOutlets.length > 0 ? cityOutlets.map(outlet => (
                                    <TableRow key={outlet.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4 text-muted-foreground" />
                                                {outlet.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {outlet.openingTime} - {outlet.closingTime}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={outlet.isOpen}
                                                onCheckedChange={() => handleToggleStatus(outlet.id, outlet.isOpen)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic">No outlets in {city.name}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
      )})}
    </div>
  );
}
