
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import type { MenuItem, Category, UserProfile, OutletMenuAvailability } from '@/lib/types';
import Image from 'next/image';
import { useCollection, useDoc, useUser, useFirestore } from '@/firebase';
import { placeholderImageMap } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function AdminMenuPage() {
  const { user } = useUser();
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  const outletId = userProfile?.outletId;
  
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: availabilityData, loading: availabilityLoading } = useCollection<OutletMenuAvailability>(`outlets/${outletId}/menuAvailability`);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (availabilityData) {
      const newMap: Record<string, boolean> = {};
      availabilityData.forEach(item => {
        const id = (item as any).id; // The document ID is the menuItemId
        newMap[id] = item.isAvailable;
      });
      setAvailabilityMap(newMap);
    }
  }, [availabilityData]);

  const handleToggleAvailability = (itemId: string, isGloballyAvailable: boolean) => {
    if (!firestore || !outletId) return;

    if (!isGloballyAvailable) {
        toast({ variant: 'destructive', title: 'Action not allowed', description: 'This item is managed by the franchise and cannot be toggled here.'});
        return;
    }

    const currentStatus = availabilityMap[itemId] ?? true; // Default to available
    const newStatus = !currentStatus;

    const availabilityRef = doc(firestore, `outlets/${outletId}/menuAvailability`, itemId);

    setDoc(availabilityRef, { isAvailable: newStatus })
        .then(() => {
            setAvailabilityMap(prev => ({ ...prev, [itemId]: newStatus }));
            toast({ title: 'Availability updated' });
        })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: availabilityRef.path,
                operation: 'write',
                requestResourceData: { isAvailable: newStatus }
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const isLoading = menuItemsLoading || categoriesLoading || availabilityLoading;
  const sortedCategories = categories ? [...categories].sort((a,b) => (a as any).order - (b as any).order) : [];

  return (
    <div className="container mx-auto p-0">
      <div className="mb-4">
        <h1 className="font-headline text-3xl font-bold">Menu Management</h1>
        <p className="text-muted-foreground">Toggle availability of menu items for your outlet.</p>
      </div>

      {isLoading ? (
        Array.from({length: 3}).map((_, i) => (
          <div key={i} className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Card><CardContent className="p-0"><Skeleton className="w-full h-64" /></CardContent></Card>
          </div>
        ))
      ) : sortedCategories.map(category => (
        <div key={category.id} className="mb-8">
            <h2 className="font-headline text-2xl font-bold mb-4">{category.name}</h2>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {menuItems?.filter(item => item.category === category.id).map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                      <Image
                                        src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                                        alt={item.name}
                                        width={56}
                                        height={56}
                                        className="rounded-md object-cover"
                                      />
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground hidden md:block">{item.description}</p>
                                    </TableCell>
                                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Switch
                                            checked={!item.isAvailableGlobally ? false : (availabilityMap[item.id] ?? true)}
                                            disabled={!item.isAvailableGlobally}
                                            onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailableGlobally)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      ))}
    </div>
  );
}
