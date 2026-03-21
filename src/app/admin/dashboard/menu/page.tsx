"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import type { MenuItem, Category, UserProfile, OutletMenuAvailability, Outlet } from '@/lib/types';
import Image from 'next/image';
import { useUser, useCollection, useDoc, useFirestore } from '@/firebase';
import { placeholderImageMap } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export default function AdminMenuPage() {
  const { user } = useUser();
  const profileId = user?.email?.toLowerCase().trim() || 'dummy';
  const { data: userProfile } = useDoc<UserProfile>('users', profileId);
  const outletId = userProfile?.outletId;
  const { data: outlet } = useDoc<Outlet>('outlets', outletId || 'dummy');
  
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
  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="container mx-auto p-0 max-w-2xl">
      <div className="mb-6 bg-white p-4 rounded-[24px] border shadow-sm flex items-center justify-between">
        <div className="text-left">
            <h1 className="font-headline text-2xl font-black uppercase tracking-tight italic" style={{ color: brandColor }}>Kitchen Stock</h1>
            <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-0.5">Availability Override</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gray-50 shadow-inner ring-1 ring-black/5">
            <Layers className="h-4 w-4" style={{ color: brandColor }} />
        </div>
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
          <div key={category.id} className="mb-8">
              <div className="flex items-center gap-3 mb-3 pl-2">
                <div className="h-1 w-6 rounded-full bg-primary/20" />
                <h2 className="font-headline text-lg font-black italic uppercase tracking-tighter text-[#111]">{category.name}</h2>
              </div>
              <Card className="border-none shadow-sm rounded-[24px] overflow-hidden bg-white border border-gray-100">
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader className="bg-gray-50/50">
                              <TableRow className="hover:bg-transparent border-b-gray-100">
                                  <TableHead className="w-[60px] pl-4 font-black uppercase text-[8px] tracking-widest h-10">Visual</TableHead>
                                  <TableHead className="font-black uppercase text-[8px] tracking-widest h-10">Details</TableHead>
                                  <TableHead className="text-right pr-4 font-black uppercase text-[8px] tracking-widest h-10">Action</TableHead>
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
                                        <TableCell className="pl-4 py-3">
                                          <div className="relative h-10 w-10 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-black/5">
                                            <Image
                                              src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                                              alt={item.name}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-left">
                                            <div className="flex flex-col">
                                              <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className={cn("h-2 w-2 rounded-full ring-1 ring-white shadow-sm", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                                <p className="font-black uppercase text-[12px] tracking-tight text-[#111] leading-none">{item.name}</p>
                                              </div>
                                              <p className="font-bold text-[10px] text-muted-foreground tabular-nums font-sans">{priceDisplay}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-4 py-3">
                                            <div className="flex flex-col items-end gap-1">
                                                <Switch
                                                    checked={!item.isAvailableGlobally ? false : (availabilityMap[item.id] ?? true)}
                                                    disabled={!item.isAvailableGlobally}
                                                    onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailableGlobally)}
                                                    className="data-[state=checked]:bg-green-500 scale-90"
                                                />
                                                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground">
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
