"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { MENU_ITEMS, CATEGORIES } from '@/lib/data';
import type { MenuItem } from '@/lib/types';
import Image from 'next/image';
import { placeholderImages } from '@/lib/data';

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  const handleToggleAvailability = (itemId: string) => {
    setMenuItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  return (
    <div className="container mx-auto p-0">
      <div className="mb-4">
        <h1 className="font-headline text-3xl font-bold">Menu Management</h1>
        <p className="text-muted-foreground">Toggle availability of menu items for your outlet.</p>
      </div>

      {CATEGORIES.map(category => (
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
                            {menuItems.filter(item => item.category === category.id).map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                      <Image
                                        src={placeholderImages[item.imageId].url}
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
                                            checked={item.isAvailable}
                                            onCheckedChange={() => handleToggleAvailability(item.id)}
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
