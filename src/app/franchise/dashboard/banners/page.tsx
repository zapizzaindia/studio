
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, ImageIcon, Upload, Pizza, Flame } from 'lucide-react';
import { useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { placeholderImageMap, PlaceHolderImages } from '@/lib/placeholder-images';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Banner, Brand } from '@/lib/types';
import { cn } from "@/lib/utils";

export default function FranchiseBannersPage() {
  const { data: allBanners, loading } = useCollection<Banner>('banners');
  const { toast } = useToast();

  const [activeBrand, setActiveBrand] = useState<Brand>('zapizza');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageId, setNewImageId] = useState("banner_1");
  const [customImage, setCustomImage] = useState<string | null>(null);

  const banners = useMemo(() => allBanners?.filter(b => b.brand === activeBrand) || [], [allBanners, activeBrand]);
  const brandColor = activeBrand === 'zfry' ? '#e31837' : '#14532d';

  const handleEditClick = (banner: Banner) => {
    setEditingBanner(banner);
    setNewTitle(banner.title || "");
    setNewSubtitle(banner.subtitle || "");
    setNewPrice(banner.price || "");
    setNewImageId(banner.imageId);
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

  const handleAddBanner = () => {
    if (!newImageId && !customImage) {
      toast({ variant: 'destructive', title: 'Missing Image', description: 'Please select or upload a banner image.' });
      return;
    }

    toast({ 
      title: `${activeBrand.toUpperCase()} Banner ${editingBanner ? 'Updated' : 'Created'} (Demo)`, 
      description: newTitle ? `"${newTitle}" is now live.` : "Banner is now live." 
    });

    setNewTitle("");
    setNewSubtitle("");
    setNewPrice("");
    setNewImageId("banner_1");
    setCustomImage(null);
    setEditingBanner(null);
    setIsAddDialogOpen(false);
  };

  const handleToggleActive = (bannerId: string, current: boolean) => {
    toast({ title: 'Status updated', description: `Banner is now ${!current ? 'active' : 'inactive'}.` });
  };

  const handleDelete = (title?: string) => {
    toast({ title: 'Banner deleted', description: title ? `"${title}" has been removed.` : "Banner has been removed." });
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
      {/* Brand Selection Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                {activeBrand === 'zapizza' ? 'Zapizza' : 'Zfry'} Banners
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage promotional carousels</p>
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

      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) setEditingBanner(null); }}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: brandColor }} className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-8">
                <Plus className="mr-2 h-4 w-4" /> Create New {activeBrand.toUpperCase()} Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                {editingBanner ? 'Edit' : 'Add'} {activeBrand} Promo
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Mobile App Hero Component</DialogDescription>
            </DialogHeader>
            <div className="px-8 py-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Banner Title (Optional)</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. ULTIMATE PARTY" className="font-bold h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Subtitle (Optional)</Label>
                    <Input value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)} placeholder="e.g. Launch Offer" className="font-bold h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Price Tag (Optional)</Label>
                    <Input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. 399" className="font-bold h-12 rounded-xl" />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Banner Visual</Label>
                <div className="relative aspect-[21/9] rounded-[24px] overflow-hidden border-2 border-dashed group cursor-pointer bg-muted/20" onClick={() => document.getElementById('upload-banner')?.click()}>
                    <Image 
                        src={customImage || placeholderImageMap.get(newImageId)?.imageUrl || ''} 
                        alt="Preview" 
                        fill 
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Click to Change Image</span>
                    </div>
                    <input id="upload-banner" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/30 border-t flex gap-4">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
              <Button onClick={handleAddBanner} style={{ backgroundColor: brandColor }} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl px-10">
                {editingBanner ? 'Update and Publish' : 'Save and Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b-gray-100 hover:bg-transparent">
                <TableHead className="w-[150px] font-black uppercase text-[10px] tracking-widest h-14 pl-8">Preview</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Banner Details</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Pricing</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="py-8 px-8"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
              )) : banners.length > 0 ? banners.map(banner => (
                <TableRow key={banner.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                  <TableCell className="pl-8 py-6">
                    <div className="relative h-20 w-32 rounded-2xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5">
                      <Image
                        src={placeholderImageMap.get(banner.imageId)?.imageUrl || ''}
                        alt={banner.title || 'Banner'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                        <p className="font-black uppercase text-[13px] tracking-tight italic text-[#333]">{banner.title || 'Untitled Promo'}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{banner.subtitle || 'General Awareness'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-sm" style={{ color: brandColor }}>{banner.price ? `₹${banner.price}` : 'N/A'}</p>
                  </TableCell>
                  <TableCell>
                    <Switch 
                        checked={banner.active} 
                        onCheckedChange={() => handleToggleActive(banner.id, banner.active)} 
                    />
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all" onClick={() => handleEditClick(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl bg-gray-50 text-red-500 hover:bg-red-50 hover:shadow-md transition-all"
                        onClick={() => handleDelete(banner.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No banners created for {activeBrand.toUpperCase()}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
