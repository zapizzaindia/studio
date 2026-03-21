
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
            toast({ title: 'Status Synced', duration: 1500 });
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
      <div className="mb-6 flex flex-col">
        <h1 className="font-headline text-2xl font-black uppercase italic text-[#333]">Kitchen Stock</h1>
        <p className="text-muted-foreground text-[9px] uppercase font-black tracking-[0.2em] mt-0.5">Local Availability Override</p>
      </div>

      {isLoading ? (
        Array.from({length: 2}).map((_, i) => (
          <div key={i} className="mb-6">
            <Skeleton className="h-6 w-32 mb-3 rounded-lg" />
            <Card className="rounded-[24px] overflow-hidden"><CardContent className="p-0"><Skeleton className="w-full h-40" /></CardContent></Card>
          </div>
        ))
      ) : sortedCategories.map(category => {
        const catItems = menuItems?.filter((item: MenuItem) => item.category === category.id) || [];
        if (catItems.length === 0) return null;

        return (
          <div key={category.id} className="mb-10">
              <div className="flex items-center gap-3 mb-4 pl-2">
                <div className="h-1 w-8 rounded-full bg-primary/20" />
                <h2 className="font-headline text-lg font-black italic uppercase tracking-tight text-[#333]">{category.name}</h2>
              </div>
              <Card className="border-none shadow-md rounded-[28px] overflow-hidden bg-white">
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader className="bg-gray-50/50">
                              <TableRow className="hover:bg-transparent border-b-gray-100">
                                  <TableHead className="w-[60px] pl-5 font-black uppercase text-[9px] tracking-widest">Item</TableHead>
                                  <TableHead className="font-black uppercase text-[9px] tracking-widest">Details</TableHead>
                                  <TableHead className="text-right pr-5 font-black uppercase text-[9px] tracking-widest">Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {catItems.map((item: MenuItem) => {
                                  const hasVariations = item.variations && item.variations.length > 0;
                                  const prices = hasVariations ? item.variations!.map(v => v.price) : [item.price];
                                  const minPrice = Math.min(...prices);
                                  const priceDisplay = hasVariations ? `₹${minPrice}+` : `₹${minPrice}`;

                                  return (
                                    <TableRow key={item.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="pl-5 py-4">
                                          <div className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                            <Image
                                              src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                                              alt={item.name}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-1.5">
                                                <span className={cn("h-2 w-2 rounded-full", item.isVeg ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                                                <p className="font-black uppercase text-[12px] tracking-tight text-[#333]">{item.name}</p>
                                              </div>
                                              <p className="font-bold text-[10px] text-muted-foreground mt-0.5 tabular-nums font-sans">{priceDisplay}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-5 py-4">
                                            <Switch
                                                checked={!item.isAvailableGlobally ? false : (availabilityMap[item.id] ?? true)}
                                                disabled={!item.isAvailableGlobally}
                                                onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailableGlobally)}
                                                className="data-[state=checked]:bg-green-500 scale-90"
                                            />
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
