"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, ImageIcon, Upload } from 'lucide-react';
import { useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { placeholderImageMap, PlaceHolderImages } from '@/lib/placeholder-images';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Banner } from '@/lib/types';

export default function FranchiseBannersPage() {
  const { data: banners, loading } = useCollection<Banner>('banners');
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageId, setNewImageId] = useState("banner_1");
  const [customImage, setCustomImage] = useState<string | null>(null);

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

  const handleAddBanner = () => {
    if (!newTitle || !newSubtitle || !newPrice) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all banner details.' });
      return;
    }

    // Mock successful addition
    toast({ 
      title: "Banner created (Demo Mode)", 
      description: `"${newTitle}" is now live on the customer home page.` 
    });

    setNewTitle("");
    setNewSubtitle("");
    setNewPrice("");
    setNewImageId("banner_1");
    setCustomImage(null);
    setIsAddDialogOpen(false);
  };

  const handleToggleActive = (bannerId: string, current: boolean) => {
    toast({ title: 'Status updated', description: `Banner is now ${!current ? 'active' : 'inactive'}.` });
  };

  const handleDelete = (title: string) => {
    toast({ title: 'Banner deleted', description: `"${title}" has been removed.` });
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Global Banners</h1>
          <p className="text-muted-foreground">Manage the promotional carousel on the customer home page.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#14532d] hover:bg-[#0f4023]"><Plus className="mr-2 h-4 w-4" /> Create New Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Promotional Banner</DialogTitle>
              <DialogDescription>Banners appear in the hero section of the mobile app.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Banner Title (Major Heading)</Label>
                <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. ULTIMATE PIZZA PARTY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Minor Heading)</Label>
                <Input id="subtitle" value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)} placeholder="e.g. Freshly Launched!" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price Tag (Starting @)</Label>
                <Input id="price" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. 399" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Image Selection</Label>
                  <Select onValueChange={(val) => { setNewImageId(val); setCustomImage(null); }} value={newImageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select image" />
                    </SelectTrigger>
                    <SelectContent>
                      {PlaceHolderImages.filter(img => img.id.startsWith('banner')).map(img => (
                        <SelectItem key={img.id} value={img.id}>{img.id.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload">Or Upload Custom</Label>
                  <div className="relative">
                    <Input 
                      id="upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => document.getElementById('upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 border rounded-lg overflow-hidden bg-muted/20 flex flex-col items-center justify-center aspect-video relative group">
                 <Image 
                    src={customImage || placeholderImageMap.get(newImageId)?.imageUrl || ''} 
                    alt="Preview" 
                    fill 
                    className="object-cover"
                 />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-black uppercase text-xs tracking-widest">Image Preview</span>
                 </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddBanner} className="bg-[#14532d] hover:bg-[#0f4023] w-full">Save and Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Preview</TableHead>
                <TableHead>Banner Details</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              )) : banners?.map(banner => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="relative h-16 w-24 rounded-md overflow-hidden border">
                      <Image
                        src={placeholderImageMap.get(banner.imageId)?.imageUrl || ''}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-sm">{banner.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{banner.subtitle}</p>
                  </TableCell>
                  <TableCell>₹{banner.price}</TableCell>
                  <TableCell>
                    <Switch 
                        checked={banner.active} 
                        onCheckedChange={() => handleToggleActive(banner.id, banner.active)} 
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(banner.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
}
