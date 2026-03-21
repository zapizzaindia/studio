
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
import { Layers, Info } from 'lucide-react';

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
    <div className="container mx-auto p-0 max-w-2xl overflow-x-hidden">
      <div className="mb-4 bg-white p-4 rounded-[24px] border shadow-sm flex items-center justify-between">
        <div className="text-left">
            <h1 className="font-headline text-2xl font-black uppercase tracking-tight italic" style={{ color: brandColor }}>Kitchen Stock</h1>
            <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-0.5">Availability Overrides</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gray-50 shadow-inner ring-1 ring-black/5">
            <Layers className="h-4 w-4" style={{ color: brandColor }} />
        </div>
      </div>

      {isLoading ? (
        Array.from({length: 2}).map((_, i) => (
          <div key={i} className="mb-6">
            <Skeleton className="h-6 w-32 mb-3 rounded-lg ml-2" />
            <Card className="rounded-[24px] overflow-hidden border-none shadow-sm"><CardContent className="p-0"><Skeleton className="w-full h-48" /></CardContent></Card>
          </div>
        ))
      ) : sortedCategories.map(category => {
        const catItems = menuItems?.filter((item: MenuItem) => item.category === category.id) || [];
        if (catItems.length === 0) return null;

        return (
          <div key={category.id} className="mb-6">
              <div className="flex items-center gap-2 mb-2 pl-2">
                <div className="h-1 w-4 rounded-full" style={{ backgroundColor: brandColor + '40' }} />
                <h2 className="font-headline text-sm font-black italic uppercase tracking-tighter text-[#111]">{category.name}</h2>
              </div>
              <Card className="border-none shadow-sm rounded-[24px] overflow-hidden bg-white border border-gray-100">
                  <CardContent className="p-0">
                      <div className="divide-y divide-gray-50">
                          {catItems.map((item: MenuItem) => {
                              const hasVariations = item.variations && item.variations.length > 0;
                              const prices = hasVariations ? item.variations!.map(v => v.price) : [item.price];
                              const minPrice = Math.min(...prices);
                              const priceDisplay = hasVariations ? `₹${minPrice}+` : `₹${minPrice}`;
                              const isLive = (availabilityMap[item.id] ?? true) && item.isAvailableGlobally;

                              return (
                                <div key={item.id} className="flex items-center justify-between p-3 gap-3 hover:bg-gray-50/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative h-10 w-10 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-black/5 shrink-0">
                                          <Image
                                            src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                        <div className="flex flex-col text-left min-w-0">
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={cn("h-2 w-2 rounded-full ring-1 ring-white shadow-sm shrink-0", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                            <p className="font-black uppercase text-[11px] tracking-tight text-[#111] leading-none truncate">{item.name}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-bold text-[10px] text-muted-foreground tabular-nums font-sans">{priceDisplay}</p>
                                            {!item.isAvailableGlobally && <Badge className="bg-red-50 text-red-600 border-red-100 text-[6px] h-3.5 font-black uppercase">Blocked</Badge>}
                                          </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <Switch
                                            checked={isLive}
                                            disabled={!item.isAvailableGlobally}
                                            onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailableGlobally)}
                                            className="data-[state=checked]:bg-green-500 scale-75 origin-right"
                                        />
                                        <span className={cn(
                                            "text-[7px] font-black uppercase tracking-widest",
                                            isLive ? "text-green-600" : "text-red-400"
                                        )}>
                                            {isLive ? 'LIVE' : 'OFF'}
                                        </span>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  </CardContent>
              </Card>
          </div>
        )
      })}

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 mb-12">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed text-left">
          Stock overrides are local to this kitchen. Global restrictions managed by Franchise HQ take precedence.
        </p>
      </div>
    </div>
  );
}
