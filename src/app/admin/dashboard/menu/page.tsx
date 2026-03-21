"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import type { MenuItem, Category, UserProfile, OutletMenuAvailability } from '@/lib/types';
import Image from 'next/image';
import { useUser, useCollection, useDoc, useFirestore } from '@/firebase';
import { placeholderImageMap } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminMenuPage() {
  const { user } = useUser();
  const profileId = user?.email?.toLowerCase().trim() || 'dummy';
  const { data: userProfile } = useDoc<UserProfile>('users', profileId);
  const outletId = userProfile?.outletId;
  
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: availabilityData, loading: availabilityLoading } = useCollection<OutletMenuAvailability>(`outlets/${outletId}/menuAvailability`);
  
  const db = useFirestore();
  const { toast } = useToast();

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (availabilityData) {
      const newMap: Record<string, boolean> = {};
      availabilityData.forEach((item: any) => {
        newMap[item.id] = item.isAvailable;
      });
      setAvailabilityMap(newMap);
    }
  }, [availabilityData]);

  const handleToggleAvailability = (itemId: string, isGloballyAvailable: boolean) => {
    if (!db || !outletId || outletId === 'dummy') return;

    if (!isGloballyAvailable) {
        toast({ variant: 'destructive', title: 'Managed by Franchise', description: 'This item is globally restricted.'});
        return;
    }

    const currentStatus = availabilityMap[itemId] ?? true; 
    const newStatus = !currentStatus;

    const availabilityRef = doc(
      db,
      `outlets/${outletId}/menuAvailability`,
      itemId
    );    

    // Optimistic Update
    setAvailabilityMap(prev => ({ ...prev, [itemId]: newStatus }));

    setDoc(availabilityRef, { isAvailable: newStatus }, { merge: true })
        .then(() => {
            toast({ title: 'Kitchen Synced' });
        })
        .catch(error => {
            // Revert on error
            setAvailabilityMap(prev => ({ ...prev, [itemId]: currentStatus }));
            const permissionError = new FirestorePermissionError({
                path: availabilityRef.path,
                operation: 'write',
                requestResourceData: { isAvailable: newStatus }
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const isLoading = menuItemsLoading || categoriesLoading || availabilityLoading;
  const sortedCategories = categories ? [...categories].sort((a,b) => (a.order || 0) - (b.order || 0)) : [];

  return (
    <div className="container mx-auto p-0 max-w-2xl">
      <div className="mb-8 flex flex-col text-left">
        <h1 className="font-headline text-3xl font-black uppercase italic text-[#111]">Kitchen Stock</h1>
        <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.3em] mt-1.5">Live Store Availability Override</p>
      </div>

      {isLoading ? (
        Array.from({length: 2}).map((_, i) => (
          <div key={i} className="mb-8">
            <Skeleton className="h-8 w-48 mb-4 rounded-lg" />
            <Card className="rounded-[32px] overflow-hidden border-none shadow-sm"><CardContent className="p-0"><Skeleton className="w-full h-64" /></CardContent></Card>
          </div>
        ))
      ) : sortedCategories.map(category => {
        const catItems = menuItems?.filter((item: MenuItem) => item.category === category.id) || [];
        if (catItems.length === 0) return null;

        return (
          <div key={category.id} className="mb-12">
              <div className="flex items-center gap-4 mb-5 pl-2">
                <div className="h-1.5 w-10 rounded-full bg-primary/20" />
                <h2 className="font-headline text-xl font-black italic uppercase tracking-tighter text-[#111]">{category.name}</h2>
              </div>
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader className="bg-gray-50/80">
                              <TableRow className="hover:bg-transparent border-b-gray-100">
                                  <TableHead className="w-[70px] pl-6 font-black uppercase text-[10px] tracking-widest h-14">Visual</TableHead>
                                  <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Details</TableHead>
                                  <TableHead className="text-right pr-6 font-black uppercase text-[10px] tracking-widest h-14">Action</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {catItems.map((item: MenuItem) => {
                                  const hasVariations = item.variations && item.variations.length > 0;
                                  const prices = hasVariations ? item.variations!.map(v => v.price) : [item.price];
                                  const minPrice = Math.min(...prices);
                                  const priceDisplay = hasVariations ? `₹${minPrice}+` : `₹${minPrice}`;

                                  return (
                                    <TableRow key={item.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="pl-6 py-5">
                                          <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-black/5">
                                            <Image
                                              src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                                              alt={item.name}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-left">
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                                <p className="font-black uppercase text-[14px] tracking-tight text-[#111]">{item.name}</p>
                                              </div>
                                              <p className="font-bold text-[11px] text-muted-foreground tabular-nums font-sans">{priceDisplay}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-5">
                                            <div className="flex flex-col items-end gap-2">
                                                <Switch
                                                    checked={!item.isAvailableGlobally ? false : (availabilityMap[item.id] ?? true)}
                                                    disabled={!item.isAvailableGlobally}
                                                    onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailableGlobally)}
                                                    className="data-[state=checked]:bg-green-500 scale-110"
                                                />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {(availabilityMap[item.id] ?? true) ? 'LIVE' : 'OFF'}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                  );
                              })}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </div>
        )
      })}
    </div>
  );
}