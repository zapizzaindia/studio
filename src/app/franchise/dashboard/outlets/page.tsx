'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { City, Outlet, Brand } from '@/lib/types';
import { Plus, MapPin, Store, Flame, Pizza } from 'lucide-react';
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
  const [selectedBrand, setSelectedBrand] = useState<Brand>("zapizza");

  const isLoading = outletsLoading || citiesLoading;

  const handleAddCity = async () => {
    if (!newCityName || !firestore) return;
    
    const cityData = { name: newCityName };
    addDoc(collection(firestore, 'cities'), cityData)
      .then(() => {
        toast({ title: "Success", description: `City "${newCityName}" added.` });
        setNewCityName("");
        setIsCityDialogOpen(false);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'cities',
          operation: 'create',
          requestResourceData: cityData
        }));
      });
  };

  const handleAddOutlet = async () => {
    if (!newOutletName || !selectedCityId || !firestore) return;

    const outletData = {
      name: newOutletName,
      cityId: selectedCityId,
      brand: selectedBrand,
      isOpen: true,
      openingTime: "11:00",
      closingTime: "23:00"
    };

    addDoc(collection(firestore, 'outlets'), outletData)
      .then(() => {
        toast({ title: "Success", description: `"${newOutletName}" is now established.` });
        setNewOutletName("");
        setSelectedCityId("");
        setIsOutletDialogOpen(false);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'outlets',
          operation: 'create',
          requestResourceData: outletData
        }));
      });
  };

  const handleToggleStatus = (outletId: string, currentStatus: boolean) => {
    if (!firestore) return;
    const outletRef = doc(firestore, 'outlets', outletId);
    const updateData = { isOpen: !currentStatus };

    updateDoc(outletRef, updateData)
      .then(() => {
        toast({ title: 'Status updated' });
      })
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: outletRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-primary">Regional Operations</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage cities and store infrastructure</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isOutletDialogOpen} onOpenChange={setIsOutletDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-6">
                      <Plus className="mr-2 h-4 w-4"/> Establish New Outlet
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-[32px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary italic">New Store Identity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Store Name</Label>
                            <Input placeholder="e.g. Zapizza Rudrapur" value={newOutletName} onChange={e => setNewOutletName(e.target.value)} className="h-12 rounded-xl font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Region / City</Label>
                              <Select onValueChange={setSelectedCityId} value={selectedCityId}>
                                  <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px]">
                                      <SelectValue placeholder="Select City" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {cities?.map(city => (
                                          <SelectItem key={city.id} value={city.id} className="text-[10px] font-bold uppercase">{city.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Brand Vertical</Label>
                              <Select onValueChange={(v: any) => setSelectedBrand(v)} value={selectedBrand}>
                                  <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px]">
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="zapizza" className="text-[10px] font-bold uppercase">Zapizza (Green)</SelectItem>
                                      <SelectItem value="zfry" className="text-[10px] font-bold uppercase">Zfry (Red)</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-muted/30 p-6 -mx-6 -mb-6 rounded-b-[32px]">
                        <Button onClick={handleAddOutlet} disabled={!newOutletName || !selectedCityId} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                          Activate Store
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">
                      <Plus className="mr-2 h-4 w-4"/> Add Region
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm rounded-[32px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary italic">Add New City</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">City Name</Label>
                            <Input placeholder="e.g. Rudrapur" value={newCityName} onChange={e => setNewCityName(e.target.value)} className="h-12 rounded-xl font-bold" />
                        </div>
                    </div>
                    <DialogFooter className="bg-muted/30 p-6 -mx-6 -mb-6 rounded-b-[32px]">
                        <Button onClick={handleAddCity} disabled={!newCityName} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                          Register Region
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {isLoading ? (
        Array.from({length: 2}).map((_, i) => (
            <div key={i} className="mb-8">
                <Skeleton className="h-8 w-32 mb-4" />
                <Card className="rounded-[32px] overflow-hidden"><CardContent className="p-0"><Skeleton className="w-full h-48" /></CardContent></Card>
            </div>
        ))
      ) : cities?.map(city => {
          const cityOutlets = outlets?.filter(o => o.cityId === city.id);
          return (
            <div key={city.id} className="mb-10">
                <div className="flex items-center gap-3 mb-4 pl-2">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h2 className="font-headline text-2xl font-black uppercase tracking-tight italic text-[#333]">{city.name}</h2>
                </div>
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="border-b-gray-100 hover:bg-transparent">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pl-8">Store Name</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Brand Vertical</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Operations</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Live Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cityOutlets && cityOutlets.length > 0 ? cityOutlets.map(outlet => (
                                    <TableRow key={outlet.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${outlet.brand === 'zfry' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                  <Store className="h-4 w-4" />
                                                </div>
                                                <span className="font-black uppercase text-[13px] tracking-tight italic text-[#333]">{outlet.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            {outlet.brand === 'zfry' ? <Flame className="h-3 w-3 text-red-600" /> : <Pizza className="h-3 w-3 text-green-600" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{outlet.brand}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">
                                            {outlet.openingTime} - {outlet.closingTime}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Switch
                                                checked={outlet.isOpen}
                                                onCheckedChange={() => handleToggleStatus(outlet.id, outlet.isOpen)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic uppercase text-[10px] font-black tracking-[0.2em] opacity-40">No outlets established in {city.name}</TableCell>
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
