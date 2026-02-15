
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuItem, Category, MenuItemVariation, MenuItemAddon } from '@/lib/types';
import Image from 'next/image';
import { placeholderImageMap, PlaceHolderImages } from '@/lib/placeholder-images';
import { Plus, Trash2, Edit, Save, Layers, Upload, ImageIcon, PlusCircle, Settings2, ShoppingBasket } from 'lucide-react';
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
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // New Item State
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemImageId, setNewItemImageId] = useState("margherita");
  const [newItemGlobal, setNewItemGlobal] = useState(true);
  const [newItemVariations, setNewItemVariations] = useState<MenuItemVariation[]>([]);
  const [newItemAddons, setNewItemAddons] = useState<MenuItemAddon[]>([]);
  const [newItemSides, setNewItemSides] = useState<string[]>([]);
  const [customImage, setCustomImage] = useState<string | null>(null);

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImageId, setNewCategoryImageId] = useState("cat_veg");

  const isLoading = menuItemsLoading || categoriesLoading;
  const sortedCategories = categories ? [...categories].sort((a,b) => (a as any).order - (b as any).order) : [];

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDesc(item.description || "");
    setNewItemPrice(item.price.toString());
    setNewItemCategory(item.category);
    setNewItemIsVeg(item.isVeg);
    setNewItemImageId(item.imageId);
    setNewItemGlobal(item.isAvailableGlobally);
    setNewItemVariations(item.variations || []);
    setNewItemAddons(item.addons || []);
    setNewItemSides(item.recommendedSides || []);
    setCustomImage(null);
    setIsAddDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariation = () => {
    setNewItemVariations([...newItemVariations, { name: "", price: 0, addons: [] }]);
  };

  const handleRemoveVariation = (index: number) => {
    setNewItemVariations(newItemVariations.filter((_, i) => i !== index));
  };

  const handleUpdateVariation = (index: number, field: keyof MenuItemVariation, value: any) => {
    const updated = [...newItemVariations];
    updated[index] = { ...updated[index], [field]: value };
    setNewItemVariations(updated);
  };

  const handleAddAddonToVariation = (vIndex: number) => {
    const updated = [...newItemVariations];
    const addons = updated[vIndex].addons || [];
    updated[vIndex].addons = [...addons, { name: "", price: 0 }];
    setNewItemVariations(updated);
  };

  const handleUpdateVariationAddon = (vIndex: number, aIndex: number, field: keyof MenuItemAddon, value: any) => {
    const updated = [...newItemVariations];
    const addons = [...(updated[vIndex].addons || [])];
    addons[aIndex] = { ...addons[aIndex], [field]: value };
    updated[vIndex].addons = addons;
    setNewItemVariations(updated);
  };

  const handleRemoveVariationAddon = (vIndex: number, aIndex: number) => {
    const updated = [...newItemVariations];
    const addons = (updated[vIndex].addons || []).filter((_, i) => i !== aIndex);
    updated[vIndex].addons = addons;
    setNewItemVariations(updated);
  };

  const handleAddAddon = () => {
    setNewItemAddons([...newItemAddons, { name: "", price: 0 }]);
  };

  const handleRemoveAddon = (index: number) => {
    setNewItemAddons(newItemAddons.filter((_, i) => i !== index));
  };

  const handleUpdateAddon = (index: number, field: keyof MenuItemAddon, value: string | number) => {
    const updated = [...newItemAddons];
    updated[index] = { ...updated[index], [field]: value };
    setNewItemAddons(updated);
  };

  const handleToggleSide = (itemId: string) => {
    setNewItemSides(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAddItem = () => {
    if (!newItemName || (!newItemPrice && newItemVariations.length === 0) || !newItemCategory) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out Name, Price (or Variations) and Category.' });
        return;
    }

    toast({ 
        title: editingItem ? "Item updated successfully (Demo Mode)" : "Item added successfully (Demo Mode)", 
        description: `${newItemName} has been ${editingItem ? 'updated in' : 'added to'} the global menu.` 
    });

    setNewItemName("");
    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemCategory("");
    setNewItemIsVeg(true);
    setNewItemImageId("margherita");
    setNewItemGlobal(true);
    setNewItemVariations([]);
    setNewItemAddons([]);
    setNewItemSides([]);
    setCustomImage(null);
    setEditingItem(null);
    setIsAddDialogOpen(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName) return;

    toast({
        title: "Category updated (Demo Mode)",
        description: `"${newCategoryName}" is now active with its assigned image.`
    });

    setNewCategoryName("");
    setNewCategoryImageId("cat_veg");
  };

  const handleDeleteCategory = (catName: string) => {
    toast({
        title: "Category deleted (Demo Mode)",
        description: `"${catName}" has been removed from the list.`
    });
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
                        <DialogDescription>View and manage your menu organization and imagery.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Existing Categories</Label>
                            <div className="grid grid-cols-1 gap-2 border rounded-md p-2 max-h-48 overflow-y-auto bg-muted/20">
                                {sortedCategories.length > 0 ? sortedCategories.map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center text-sm p-3 bg-white border rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-8 w-8 rounded-full overflow-hidden border">
                                                <Image 
                                                    src={placeholderImageMap.get(cat.imageId || 'cat_veg')?.imageUrl || ''} 
                                                    alt={cat.name} 
                                                    fill 
                                                    className="object-cover" 
                                                />
                                            </div>
                                            <span className="font-bold text-[#14532d]">{cat.name}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteCategory(cat.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )) : <p className="text-center py-4 text-xs text-muted-foreground">No categories found.</p>}
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add/Update Category</Label>
                            <div className="space-y-2">
                                <Input 
                                    placeholder="Category Name (e.g. Sides & Dips)" 
                                    value={newCategoryName} 
                                    onChange={e => setNewCategoryName(e.target.value)} 
                                    className="font-bold"
                                />
                                <div className="flex gap-2">
                                    <Select value={newCategoryImageId} onValueChange={setNewCategoryImageId}>
                                        <SelectTrigger className="flex-1 font-bold">
                                            <SelectValue placeholder="Select Image" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PlaceHolderImages.filter(img => img.id.startsWith('cat_')).map(img => (
                                                <SelectItem key={img.id} value={img.id}>{img.id.replace('cat_', '').toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleAddCategory} className="bg-[#14532d] hover:bg-[#0f4023]">Save</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)} className="font-black uppercase text-xs">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogTrigger asChild>
                    <Button className="bg-[#14532d] hover:bg-[#0f4023]"><Plus className="mr-2 h-4 w-4" /> Add New Item</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
                    <DialogHeader className="p-6 bg-[#14532d] text-white">
                        <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                          <PlusCircle className="h-6 w-6" /> {editingItem ? 'Edit Global Menu Item' : 'Add Global Menu Item'}
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                          {editingItem ? `Update details for ${editingItem.name}.` : 'Create a new product with full customization for all Zapizza outlets.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6">
                      <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl">
                          <TabsTrigger value="general" className="font-black uppercase text-[10px] tracking-widest">General</TabsTrigger>
                          <TabsTrigger value="variations" className="font-black uppercase text-[10px] tracking-widest">Variations</TabsTrigger>
                          <TabsTrigger value="addons" className="font-black uppercase text-[10px] tracking-widest">Global Add-ons</TabsTrigger>
                          <TabsTrigger value="sides" className="font-black uppercase text-[10px] tracking-widest">Sides</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4">
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground">Item Name</Label>
                                <Input id="name" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Paneer Tikka Pizza" className="font-bold" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase text-muted-foreground">Description</Label>
                                <Textarea id="description" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Tell us what makes it delicious..." className="font-medium" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-[10px] font-black uppercase text-muted-foreground">Base Price (₹)</Label>
                                    <Input id="price" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" className="font-black text-[#14532d]" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category" className="text-[10px] font-black uppercase text-muted-foreground">Category</Label>
                                    <Select onValueChange={setNewItemCategory} value={newItemCategory}>
                                        <SelectTrigger className="font-bold">
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
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Placeholder Image</Label>
                                    <Select onValueChange={(val) => { setNewItemImageId(val); setCustomImage(null); }} value={newItemImageId}>
                                        <SelectTrigger className="font-bold">
                                            <SelectValue placeholder="Select image" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PlaceHolderImages.filter(img => !img.id.startsWith('banner_') && !img.id.startsWith('cat_')).map(img => (
                                                <SelectItem key={img.id} value={img.id}>{img.id.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="upload-item" className="text-[10px] font-black uppercase text-muted-foreground">Or Upload Photo</Label>
                                    <div className="relative">
                                        <Input 
                                            id="upload-item" 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleFileChange}
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="w-full font-black uppercase text-[10px] h-10 tracking-widest" 
                                            onClick={() => document.getElementById('upload-item')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted/20 flex items-center justify-center group">
                                <Image 
                                    src={customImage || placeholderImageMap.get(newItemImageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                                    alt="Preview" 
                                    fill 
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-black uppercase text-xs tracking-widest flex gap-2 items-center">
                                        <ImageIcon className="h-4 w-4" /> Item Preview
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-6 pt-2 bg-muted/30 p-4 rounded-xl">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isVeg" checked={newItemIsVeg} onCheckedChange={(val: any) => setNewItemIsVeg(!!val)} />
                                    <Label htmlFor="isVeg" className="text-xs font-black uppercase tracking-widest text-[#14532d]">Vegetarian</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isGlobal" checked={newItemGlobal} onCheckedChange={(val: any) => setNewItemGlobal(!!val)} />
                                    <Label htmlFor="isGlobal" className="text-xs font-black uppercase tracking-widest text-[#14532d]">Global Availability</Label>
                                </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="variations" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Size & Pricing Variations</h4>
                              <Button variant="outline" size="sm" onClick={handleAddVariation} className="h-8 font-black uppercase text-[10px] tracking-widest text-[#14532d]">
                                <PlusCircle className="mr-1 h-3 w-3" /> Add Variation
                              </Button>
                            </div>
                            
                            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                              {newItemVariations.length === 0 ? (
                                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                                  <Settings2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No variations defined.</p>
                                </div>
                              ) : (
                                newItemVariations.map((v, i) => (
                                  <div key={i} className="space-y-3 bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="flex gap-3 items-center">
                                      <div className="flex-1 space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Variation Name</Label>
                                        <Input 
                                          placeholder="e.g. Medium" 
                                          value={v.name} 
                                          onChange={e => handleUpdateVariation(i, 'name', e.target.value)}
                                          className="h-8 font-bold"
                                        />
                                      </div>
                                      <div className="w-24 space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Price (₹)</Label>
                                        <Input 
                                          type="number" 
                                          placeholder="0" 
                                          value={v.price} 
                                          onChange={e => handleUpdateVariation(i, 'price', Number(e.target.value))}
                                          className="h-8 font-black text-[#14532d]"
                                        />
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => handleRemoveVariation(i)} className="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    <div className="pl-4 border-l-2 border-[#14532d]/20 space-y-2">
                                      <div className="flex justify-between items-center">
                                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Variation-Specific Add-ons</Label>
                                        <Button variant="link" size="sm" onClick={() => handleAddAddonToVariation(i)} className="h-auto p-0 text-[8px] font-black uppercase text-[#14532d]">
                                          + Add Add-on
                                        </Button>
                                      </div>
                                      {v.addons?.map((va, ai) => (
                                        <div key={ai} className="flex gap-2 items-center">
                                          <Input 
                                            placeholder="Topping Name" 
                                            value={va.name} 
                                            onChange={e => handleUpdateVariationAddon(i, ai, 'name', e.target.value)}
                                            className="h-7 text-[10px] font-bold"
                                          />
                                          <Input 
                                            type="number" 
                                            placeholder="Price" 
                                            value={va.price} 
                                            onChange={e => handleUpdateVariationAddon(i, ai, 'price', Number(e.target.value))}
                                            className="h-7 w-20 text-[10px] font-black text-[#14532d]"
                                          />
                                          <Button variant="ghost" size="icon" onClick={() => handleRemoveVariationAddon(i, ai)} className="h-7 w-7 text-red-400">
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="addons" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Extra Toppings & Add-ons</h4>
                              <Button variant="outline" size="sm" onClick={handleAddAddon} className="h-8 font-black uppercase text-[10px] tracking-widest text-[#14532d]">
                                <PlusCircle className="mr-1 h-3 w-3" /> Add Add-on
                              </Button>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                              {newItemAddons.length === 0 ? (
                                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                                  <Settings2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No global add-ons defined.</p>
                                </div>
                              ) : (
                                newItemAddons.map((a, i) => (
                                  <div key={i} className="flex gap-3 items-center bg-white p-3 rounded-xl border shadow-sm">
                                    <div className="flex-1 space-y-1">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Add-on Name</Label>
                                      <Input 
                                        placeholder="e.g. Extra Cheese" 
                                        value={a.name} 
                                        onChange={e => handleUpdateAddon(i, 'name', e.target.value)}
                                        className="h-8 font-bold"
                                      />
                                    </div>
                                    <div className="w-24 space-y-1">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Price (₹)</Label>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={a.price} 
                                        onChange={e => handleUpdateAddon(i, 'price', Number(e.target.value))}
                                        className="h-8 font-black text-[#14532d]"
                                      />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAddon(i)} className="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="sides" className="space-y-4">
                           <div className="space-y-4">
                             <div className="flex justify-between items-center">
                               <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommended Side Items</h4>
                             </div>
                             
                             <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                               {menuItems?.length === 0 ? (
                                 <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                                   <ShoppingBasket className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No side items found.</p>
                                 </div>
                               ) : (
                                 menuItems?.map(item => (
                                   <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border shadow-sm hover:border-[#14532d] transition-colors">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 relative rounded overflow-hidden flex-shrink-0">
                                            <Image 
                                              src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                                              alt={item.name} 
                                              fill 
                                              className="object-cover" 
                                            />
                                         </div>
                                         <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[#14532d]">{item.name}</span>
                                            <span className="text-[9px] font-black text-muted-foreground uppercase">₹{item.price}</span>
                                         </div>
                                      </div>
                                      <Checkbox 
                                        id={`side-${item.id}`} 
                                        checked={newItemSides.includes(item.id)} 
                                        onCheckedChange={() => handleToggleSide(item.id)} 
                                      />
                                   </div>
                                 ))
                               )}
                             </div>
                           </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <DialogFooter className="p-6 bg-muted/50 rounded-b-2xl border-t gap-3 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="font-black uppercase text-xs tracking-widest h-12">Cancel</Button>
                        <Button onClick={handleAddItem} className="bg-[#14532d] hover:bg-[#0f4023] font-black uppercase text-xs tracking-widest h-12 px-10">
                          {editingItem ? 'Update Product' : 'Save Product'}
                        </Button>
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
        <div key={category.id} id={`cat-${category.id}`} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                    <Image 
                        src={placeholderImageMap.get(category.imageId || 'cat_veg')?.imageUrl || ''} 
                        alt={category.name} 
                        fill 
                        className="object-cover" 
                    />
                </div>
                <h2 className="font-headline text-2xl font-bold">{category.name}</h2>
            </div>
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
                                        {item.variations && item.variations.length > 0 && (
                                          <div className="flex gap-1 mt-1">
                                            {item.variations.map((v, idx) => (
                                              <span key={idx} className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-muted rounded-full">
                                                {v.name}: ₹{v.price}
                                              </span>
                                            ))}
                                          </div>
                                        )}
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(item)}><Edit className="h-4 w-4"/></Button>
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
