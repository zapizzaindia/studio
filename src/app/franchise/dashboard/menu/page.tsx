
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { MenuItem, Category } from '@/lib/types';
import Image from 'next/image';
import { placeholderImageMap } from '@/lib/placeholder-images';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function FranchiseMenuPage() {
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');

  const isLoading = menuItemsLoading || categoriesLoading;
  const sortedCategories = categories ? [...categories].sort((a,b) => (a as any).order - (b as any).order) : [];

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h1 className="font-headline text-3xl font-bold">Global Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, or remove items from the menu.</p>
        </div>
        <Button><Plus /> Add New Item</Button>
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
                                <TableHead>Veg?</TableHead>
                                <TableHead>Global Availability</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-muted-foreground">₹</span>
                                            <Input type="number" defaultValue={item.price.toFixed(2)} className="w-24" />
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        <Checkbox checked={item.isVeg} />
                                    </TableCell>
                                     <TableCell>
                                        <Checkbox checked={item.isAvailableGlobally} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </div>
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
