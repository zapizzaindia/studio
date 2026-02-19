
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
        toast({ variant: 'destructive', title: 'Action not allowed', description: 'This item is managed by the franchise and cannot be toggled here.'});
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
            toast({ title: 'Availability updated', duration: 2000 });
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
    <div className="container mx-auto p-0">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Kitchen Stock</h1>
        <p className="text-muted-foreground">Toggle availability of menu items for your local outlet.</p>
      </div>

      {isLoading ? (
        Array.from({length: 3}).map((_, i) => (
          <div key={i} className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Card><CardContent className="p-0"><Skeleton className="w-full h-64" /></CardContent></Card>
          </div>
        ))
      ) : sortedCategories.map(category => {
        const catItems = menuItems?.filter((item: MenuItem) => item.category === category.id) || [];
        if (catItems.length === 0) return null;

        return (
          <div key={category.id} className="mb-10">
              <h2 className="font-headline text-2xl font-bold mb-4 italic uppercase tracking-tight text-[#333]">{category.name}</h2>
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader className="bg-gray-50/50">
                              <TableRow className="border-b-gray-100 hover:bg-transparent">
                                  <TableHead className="w-[80px] pl-8">Image</TableHead>
                                  <TableHead>Item</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead className="text-right pr-8">Available</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {catItems.map((item: MenuItem) => (
                                  <TableRow key={item.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                      <TableCell className="pl-8 py-4">
                                        <div className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-white shadow-md">
                                          <Image
                                            src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                              <span className={cn("h-2 w-2 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                              <p className="font-black uppercase text-xs tracking-tight">{item.name}</p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground hidden md:block mt-0.5">{item.description}</p>
                                          </div>
                                      </TableCell>
                                      <TableCell className="font-bold">₹{item.price.toFixed(2)}</TableCell>
                                      <TableCell className="text-right pr-8">
                                          <Switch
                                              checked={!item.isAvailableGlobally ? false : (availabilityMap[item.id] ?? true)}
                                              disabled={!item.isAvailableGlobally}
                                              onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailableGlobally)}
                                              className="data-[state=checked]:bg-green-500"
                                          />
                                      </TableCell>
                                  </TableRow>
                              ))}
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
