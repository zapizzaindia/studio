
"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuItem, Category, MenuItemVariation, MenuItemAddon, Brand } from '@/lib/types';
import Image from 'next/image';
import { placeholderImageMap, getImageUrl } from '@/lib/placeholder-images';
import { Plus, Trash2, Edit, Layers, ImageIcon, PlusCircle, IndianRupee, Flame, Pizza, Loader2, Link as LinkIcon, Upload, Check } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function FranchiseMenuPage() {
  const firestore = useFirestore();
  const { data: allMenuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  const { data: allCategories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { toast } = useToast();

  const [activeBrand, setActiveBrand] = useState<Brand>('zapizza');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);

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

  const menuItems = useMemo(() => allMenuItems?.filter(item => item.brand === activeBrand) || [], [allMenuItems, activeBrand]);
  const categories = useMemo(() => allCategories?.filter(cat => cat.brand === activeBrand) || [], [allCategories, activeBrand]);

  const isLoading = menuItemsLoading || categoriesLoading;
  const sortedCategories = useMemo(() => [...categories].sort((a,b) => (a.order || 0) - (b.order || 0)), [categories]);

  const brandColor = activeBrand === 'zfry' ? '#e31837' : '#14532d';

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
    setIsAddDialogOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryImageId(cat.imageId || "cat_veg");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isCategory = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 1MB for best performance.' });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        if (isCategory) {
            setNewCategoryImageId(reader.result as string);
        } else {
            setNewItemImageId(reader.result as string);
        }
        toast({ title: 'Image Processed', description: 'New visual asset ready for sync.' });
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = () => {
    if (!firestore || !newItemName || !newItemCategory) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out at least Name and Category.' });
        return;
    }

    setIsSaving(true);
    const itemData: any = {
        name: newItemName,
        description: newItemDesc,
        price: Number(newItemPrice) || 0,
        category: newItemCategory,
        isVeg: newItemIsVeg,
        imageId: newItemImageId,
        isAvailableGlobally: newItemGlobal,
        brand: activeBrand,
        variations: newItemVariations,
        addons: newItemAddons,
        recommendedSides: newItemSides,
        isAvailable: true
    };

    if (editingItem) {
        updateDoc(doc(firestore, 'menuItems', editingItem.id), itemData)
            .then(() => {
                toast({ title: 'Item Updated' });
                setIsAddDialogOpen(false);
                setEditingItem(null);
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `menuItems/${editingItem.id}`,
                    operation: 'update',
                    requestResourceData: itemData
                }));
            })
            .finally(() => setIsSaving(false));
    } else {
        addDoc(collection(firestore, 'menuItems'), itemData)
            .then(() => {
                toast({ title: 'Item Created' });
                setIsAddDialogOpen(false);
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'menuItems',
                    operation: 'create',
                    requestResourceData: itemData
                }));
            })
            .finally(() => setIsSaving(false));
    }
  };

  // Category Logic
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImageId, setNewCategoryImageId] = useState("cat_veg");

  const handleAddCategory = () => {
    if (!firestore || !newCategoryName) return;
    
    setIsSaving(true);
    const categoryData = {
        name: newCategoryName,
        imageId: newCategoryImageId,
        brand: activeBrand,
        order: sortedCategories.length + 1
    };

    if (editingCategory) {
        updateDoc(doc(firestore, 'categories', editingCategory.id), categoryData)
            .then(() => {
                toast({ title: 'Category Updated' });
                setEditingCategory(null);
                setNewCategoryName("");
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `categories/${editingCategory.id}`,
                    operation: 'update',
                    requestResourceData: categoryData
                }));
            })
            .finally(() => setIsSaving(false));
    } else {
        addDoc(collection(firestore, 'categories'), categoryData)
            .then(() => {
                toast({ title: 'Category Created' });
                setNewCategoryName("");
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'categories',
                    operation: 'create',
                    requestResourceData: categoryData
                }));
            })
            .finally(() => setIsSaving(false));
    }
  };

  const handleDeleteItem = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'menuItems', id))
        .then(() => toast({ title: 'Item Removed' }))
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `menuItems/${id}`,
                operation: 'delete'
            }));
        });
  };

  const handleDeleteCategory = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'categories', id))
        .then(() => toast({ title: 'Category Removed' }))
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `categories/${id}`,
                operation: 'delete'
            }));
        });
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                {activeBrand === 'zapizza' ? 'Zapizza' : 'Zfry'} Global Menu
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage master products and categories</p>
        </div>
        
        <div className="flex bg-muted/50 p-1.5 rounded-2xl border w-full sm:w-auto h-14">
            <button 
                onClick={() => setActiveBrand('zapizza')}
                className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                    activeBrand === 'zapizza' ? "bg-white text-[#14532d] shadow-md ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Pizza className="h-4 w-4" /> Zapizza
            </button>
            <button 
                onClick={() => setActiveBrand('zfry')}
                className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                    activeBrand === 'zfry' ? "bg-white text-[#e31837] shadow-md ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Flame className="h-4 w-4" /> Zfry
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => { setIsCategoryDialogOpen(open); if (!open) { setEditingCategory(null); setNewCategoryName(""); } }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 shadow-sm">
                    <Layers className="mr-2 h-4 w-4" /> Manage {activeBrand === 'zapizza' ? 'Zapizza' : 'Zfry'} Categories
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-muted/30">
                    <DialogTitle className="text-xl font-black uppercase tracking-widest" style={{ color: brandColor }}>Categories Manager</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground">Organization for {activeBrand}</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Existing Categories</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                            {sortedCategories.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-8 w-8 rounded-full overflow-hidden border bg-white">
                                            <Image src={getImageUrl(cat.imageId || 'cat_veg')} alt={cat.name} fill className="object-cover" />
                                        </div>
                                        <span className="font-bold text-sm uppercase tracking-tight">{cat.name}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCategory(cat)}><Edit className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator className="opacity-50" />
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 bg-white shadow-inner flex-shrink-0">
                                <Image src={getImageUrl(newCategoryImageId)} alt="Preview" fill className="object-cover" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <input type="file" hidden ref={catFileInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, true)} />
                                <Button 
                                    variant="outline" 
                                    className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest border-dashed"
                                    onClick={() => catFileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-3 w-3" /> Upload Icon
                                </Button>
                                <Select onValueChange={setNewCategoryImageId} value={newCategoryImageId.startsWith('data:') ? 'custom' : newCategoryImageId}>
                                    <SelectTrigger className="h-10 text-[9px] font-black uppercase">
                                        <SelectValue placeholder="Or Select Default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cat_veg">Veg Pizza</SelectItem>
                                        <SelectItem value="cat_nonveg">Non-Veg</SelectItem>
                                        <SelectItem value="cat_beverages">Drinks</SelectItem>
                                        <SelectItem value="cat_desserts">Sweets</SelectItem>
                                        {newCategoryImageId.startsWith('data:') && <SelectItem value="custom">Custom Image</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Input placeholder="e.g. Gourmet Specials" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="font-bold h-12 rounded-xl" />
                        <Button onClick={handleAddCategory} disabled={isSaving} style={{ backgroundColor: brandColor }} className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : (editingCategory ? 'Update Category' : 'Create Category')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) setEditingItem(null); }}>
            <DialogTrigger asChild>
                <Button style={{ backgroundColor: brandColor }} className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-8">
                    <PlusCircle className="mr-2 h-4 w-4" /> ADD NEW ITEM
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[32px] shadow-2xl flex flex-col">
                <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                      {editingItem ? 'Modify' : 'Create'} {activeBrand} Product
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Master Menu Configuration</DialogDescription>
                </DialogHeader>
                
                <div className="p-8">
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted/30 p-1.5 rounded-2xl border">
                      <TabsTrigger value="general" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">General</TabsTrigger>
                      <TabsTrigger value="variations" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Sizes</TabsTrigger>
                      <TabsTrigger value="addons" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Global Toppings</TabsTrigger>
                      <TabsTrigger value="visual" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Visual Asset</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Product Title</Label>
                                <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Smoky BBQ Chicken" className="font-bold h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Menu Description</Label>
                                <Textarea value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Write something tempting..." className="font-medium rounded-xl min-h-[100px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Base Price (₹)</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="pl-10 font-black h-12 rounded-xl" style={{ color: brandColor }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Category</Label>
                                    <Select onValueChange={setNewItemCategory} value={newItemCategory}>
                                        <SelectTrigger className="font-bold h-12 rounded-xl uppercase text-xs">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id} className="uppercase text-[10px] font-bold">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 bg-gray-50 p-5 rounded-[20px] border border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <Checkbox id="isVeg" checked={newItemIsVeg} onCheckedChange={(val: any) => setNewItemIsVeg(!!val)} />
                                    <Label htmlFor="isVeg" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Vegetarian</Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Checkbox id="isGlobal" checked={newItemGlobal} onCheckedChange={(val: any) => setNewItemGlobal(!!val)} />
                                    <Label htmlFor="isGlobal" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Live Globally</Label>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="visual" className="space-y-6">
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-[24px] p-6 border border-dashed flex flex-col items-center justify-center min-h-[200px]">
                                <div className="relative h-40 w-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white">
                                    <Image src={getImageUrl(newItemImageId)} alt="Preview" fill className="object-cover" />
                                </div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-4">Current Asset Preview</p>
                            </div>

                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                            <Upload className="h-3 w-3" /> Upload Photo
                                        </Label>
                                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 bg-white shadow-sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Browse Files
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                            <LinkIcon className="h-3 w-3" /> External URL
                                        </Label>
                                        <Input 
                                            value={newItemImageId.startsWith('http') ? newItemImageId : ''} 
                                            onChange={e => setNewItemImageId(e.target.value)} 
                                            placeholder="https://..." 
                                            className="font-bold h-12 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-black">
                                        <span className="bg-white px-2 text-muted-foreground">OR Quick Select</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Brand Photography Library</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Array.from(placeholderImageMap.keys()).map(id => (
                                            <button 
                                                key={id}
                                                onClick={() => setNewItemImageId(id)}
                                                className={cn(
                                                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                                                    newItemImageId === id ? "border-primary ring-2 ring-primary/20 scale-95" : "border-transparent opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <Image src={getImageUrl(id)} alt={id} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="variations" className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Portion & Size Options</h4>
                            <Button variant="ghost" size="sm" onClick={() => setNewItemVariations([...newItemVariations, { name: "", price: 0, addons: [] }])} className="h-8 font-black uppercase text-[10px] tracking-widest" style={{ color: brandColor }}>+ Add Size</Button>
                        </div>
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                            {newItemVariations.map((v, i) => (
                                <div key={i} className="flex flex-col gap-4 bg-white p-5 rounded-2xl border shadow-sm border-gray-100">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Size Name</Label>
                                            <Input placeholder="e.g. Regular" value={v.name} onChange={e => {
                                                const updated = [...newItemVariations];
                                                updated[i].name = e.target.value;
                                                setNewItemVariations(updated);
                                            }} className="h-10 font-bold text-xs" />
                                        </div>
                                        <div className="w-32 space-y-1">
                                            <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Price (₹)</Label>
                                            <Input type="number" value={v.price} onChange={e => {
                                                const updated = [...newItemVariations];
                                                updated[i].price = Number(e.target.value);
                                                setNewItemVariations(updated);
                                            }} className="h-10 font-black text-xs" style={{ color: brandColor }} />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setNewItemVariations(newItemVariations.filter((_, idx) => idx !== i))} className="mt-5 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[7px] font-black uppercase text-muted-foreground tracking-[0.2em]">Addons for this size</Label>
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                const updated = [...newItemVariations];
                                                updated[i].addons = [...(updated[i].addons || []), { name: "", price: 0 }];
                                                setNewItemVariations(updated);
                                            }} className="h-6 px-2 font-black uppercase text-[8px] tracking-widest" style={{ color: brandColor }}>+ Add Addon</Button>
                                        </div>
                                        <div className="space-y-2">
                                            {v.addons?.map((addon, aIdx) => (
                                                <div key={aIdx} className="flex gap-2 items-center">
                                                    <Input placeholder="Addon Name" value={addon.name} onChange={e => {
                                                        const updated = [...newItemVariations];
                                                        updated[i].addons![aIdx].name = e.target.value;
                                                        setNewItemVariations(updated);
                                                    }} className="h-8 font-bold text-[10px]" />
                                                    <Input type="number" placeholder="₹" value={addon.price} onChange={e => {
                                                        const updated = [...newItemVariations];
                                                        updated[i].addons![aIdx].price = Number(e.target.value);
                                                        setNewItemVariations(updated);
                                                    }} className="h-8 w-20 font-black text-[10px]" />
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        const updated = [...newItemVariations];
                                                        updated[i].addons = updated[i].addons?.filter((_, idx) => idx !== aIdx);
                                                        setNewItemVariations(updated);
                                                    }} className="h-8 w-8 text-red-400"><Trash2 className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="addons" className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Toppings & Add-ons</h4>
                                <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1">Used if an item has no sizes defined</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setNewItemAddons([...newItemAddons, { name: "", price: 0 }])} className="h-8 font-black uppercase text-[10px] tracking-widest" style={{ color: brandColor }}>+ Add Global Topping</Button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                            {newItemAddons.map((a, i) => (
                                <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-2xl border shadow-sm border-gray-100">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[8px] font-black text-muted-foreground uppercase">Add-on Title</Label>
                                        <Input placeholder="e.g. Extra Cheese" value={a.name} onChange={e => {
                                            const updated = [...newItemAddons];
                                            updated[i].name = e.target.value;
                                            setNewItemAddons(updated);
                                        }} className="h-10 font-bold text-xs" />
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <Label className="text-[8px] font-black text-muted-foreground uppercase">Price (₹)</Label>
                                        <Input type="number" value={a.price} onChange={e => {
                                            const updated = [...newItemAddons];
                                            updated[i].price = Number(e.target.value);
                                            setNewItemAddons(updated);
                                        }} className="h-10 font-black text-xs" style={{ color: brandColor }} />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setNewItemAddons(newItemAddons.filter((_, idx) => idx !== i))} className="mt-5 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter className="p-8 bg-muted/30 border-t flex gap-4">
                    <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
                    <Button onClick={handleAddItem} disabled={isSaving} style={{ backgroundColor: brandColor }} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl px-10">
                      {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : (editingItem ? 'Confirm Changes' : `Save ${activeBrand.toUpperCase()} Product`)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-8">
            {Array.from({length: 2}).map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Card className="rounded-[32px] overflow-hidden border-none shadow-sm"><CardContent className="p-0"><Skeleton className="w-full h-[300px]" /></CardContent></Card>
                </div>
            ))}
        </div>
      ) : sortedCategories.map(category => {
        const catItems = menuItems.filter(item => item.category === category.id);
        if (catItems.length === 0 && !categoriesLoading) return null;

        return (
            <div key={category.id} className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-4 border-white shadow-md ring-1 ring-black/5">
                        <Image src={getImageUrl(category.imageId || 'cat_veg')} alt={category.name} fill className="object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>{category.name}</h2>
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{catItems.length} Products Available</span>
                    </div>
                </div>
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="border-b-gray-100 hover:bg-transparent">
                                    <TableHead className="w-[100px] font-black uppercase text-[10px] tracking-widest h-14 pl-8">Photo</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Product Details</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Pricing</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {catItems.map(item => (
                                    <TableRow key={item.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="pl-8 py-6">
                                            <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5">
                                                <Image src={getImageUrl(item.imageId)} alt={item.name} fill className="object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                                                    <p className="font-black uppercase text-[13px] tracking-tight italic text-[#333]">{item.name}</p>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground font-medium line-clamp-1 max-w-xs">{item.description}</p>
                                                {item.variations && item.variations.length > 0 && (
                                                    <div className="flex gap-1.5 pt-1">
                                                        {item.variations.map((v, idx) => (
                                                            <span key={idx} className="text-[8px] font-black uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                                                                {v.name}: ₹{v.price} {v.addons && v.addons.length > 0 && `(+${v.addons.length} opts)`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-black text-sm" style={{ color: brandColor }}>
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                <span>{item.price.toFixed(2)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all" onClick={() => handleEditClick(item)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-gray-50 text-red-500 hover:bg-red-50 hover:shadow-md transition-all" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
      })}
    </div>
  );
}
