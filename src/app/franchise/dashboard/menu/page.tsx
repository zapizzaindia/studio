
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MenuItem, Category } from '@/lib/types';
import Image from 'next/image';
import { placeholderImageMap, PlaceHolderImages } from '@/lib/placeholder-images';
import { Plus, Trash2, Edit, Save, Layers } from 'lucide-react';
import { useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function FranchiseMenuPage() {
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  // New Item State
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemImageId, setNewItemImageId] = useState("margherita");
  const [newItemGlobal, setNewItemGlobal] = useState(true);

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState("");

  const isLoading = menuItemsLoading || categoriesLoading;
  const sortedCategories = categories ? [...categories].sort((a,b) => (a as any).order - (b as any).order) : [];

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice || !newItemCategory) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out Name, Price and Category.' });
        return;
    }

    // Demo Mode Mock
    toast({ 
        title: "Item added successfully (Demo Mode)", 
        description: `${newItemName} has been added to the global menu.` 
    });

    // Reset Form
    setNewItemName("");
    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemCategory("");
    setNewItemIsVeg(true);
    setNewItemImageId("margherita");
    setNewItemGlobal(true);
    setIsAddDialogOpen(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName) return;

    // Demo Mode Mock
    toast({
        title: "Category created (Demo Mode)",
        description: `"${newCategoryName}" is now available for menu organization.`
    });

    setNewCategoryName("");
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="font-headline text-3xl font-bold">Global Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, or remove items from the master menu.</p>
        </div>
        
        <div className="flex gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Layers className="mr-2 h-4 w-4" /> Manage Categories</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Menu Categories</DialogTitle>
                        <DialogDescription>View and add categories to organize your menu.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Existing Categories</Label>
                            <div className="grid grid-cols-1 gap-2 border rounded-md p-2 max-h-48 overflow-y-auto bg-muted/20">
                                {sortedCategories.length > 0 ? sortedCategories.map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center text-sm p-3 bg-white border rounded-lg shadow-sm">
                                        <span className="font-bold text-[#14532d]">{cat.name}</span>
                                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Order: {(cat as any).order}</span>
                                    </div>
                                )) : <p className="text-center py-4 text-xs text-muted-foreground">No categories found.</p>}
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                            <Label htmlFor="new-cat" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add New Category</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="new-cat" 
                                    placeholder="e.g. Sides & Dips" 
                                    value={newCategoryName} 
                                    onChange={e => setNewCategoryName(e.target.value)} 
                                    className="font-bold"
                                />
                                <Button onClick={handleAddCategory} className="bg-[#14532d] hover:bg-[#0f4023]">Add</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)} className="font-black uppercase text-xs">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-[#14532d] hover:bg-[#0f4023]"><Plus className="mr-2 h-4 w-4" /> Add New Item</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Global Menu Item</DialogTitle>
                        <DialogDescription>Create a new product for all Zapizza outlets.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input id="name" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Paneer Tikka Pizza" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Tell us what makes it delicious..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input id="price" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select onValueChange={setNewItemCategory} value={newItemCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories?.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Placeholder Image</Label>
                            <Select onValueChange={setNewItemImageId} value={newItemImageId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select image" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PlaceHolderImages.map(img => (
                                        <SelectItem key={img.id} value={img.id}>{img.id.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isVeg" checked={newItemIsVeg} onCheckedChange={(val: boolean) => setNewItemIsVeg(val)} />
                                <Label htmlFor="isVeg">Vegetarian</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isGlobal" checked={newItemGlobal} onCheckedChange={(val: boolean) => setNewItemGlobal(val)} />
                                <Label htmlFor="isGlobal">Global Availability</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddItem} className="bg-[#14532d] hover:bg-[#0f4023]">Save Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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
                                <TableHead>Global</TableHead>
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
                                        <p className="text-sm text-muted-foreground hidden md:block line-clamp-1">{item.description}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-muted-foreground">₹</span>
                                            <Input type="number" defaultValue={item.price.toFixed(2)} className="w-24 h-8" />
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
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
