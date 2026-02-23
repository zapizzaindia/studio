
"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, ImageIcon, Upload, Pizza, Flame, Loader2, Link as LinkIcon, Star } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { placeholderImageMap, getImageUrl } from '@/lib/placeholder-images';
import type { Banner, Brand } from '@/lib/types';
import { cn } from "@/lib/utils";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function FranchiseBannersPage() {
  const firestore = useFirestore();
  const { data: allBanners, loading } = useCollection<Banner>('banners');
  const { toast } = useToast();

  const [activeBrand, setActiveBrand] = useState<Brand>('zapizza');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageId, setNewImageId] = useState("banner_1");
  const [isHero, setIsHero] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const banners = useMemo(() => allBanners?.filter(b => b.brand === activeBrand) || [], [allBanners, activeBrand]);
  const brandColor = activeBrand === 'zfry' ? '#e31837' : '#14532d';

  const handleEditClick = (banner: Banner) => {
    setEditingBanner(banner);
    setNewTitle(banner.title || "");
    setNewSubtitle(banner.subtitle || "");
    setNewPrice(banner.price || "");
    setNewImageId(banner.imageId);
    setIsHero(!!banner.isHero);
    setMediaType(banner.mediaType || 'image');
    setIsAddDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
        setMediaType('video');
        const reader = new FileReader();
        reader.onload = (event) => {
            setNewImageId(event.target?.result as string);
            toast({ title: 'Video Uploaded', description: 'Asset ready for hero background.' });
        };
        reader.readAsDataURL(file);
        return;
    }

    setMediaType('image');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setNewImageId(dataUrl);
        toast({ title: 'HD Visual Optimized', description: 'Photo processed for high-res display.' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddBanner = () => {
    if (!firestore) return;

    setIsSaving(true);
    const bannerData = {
        title: newTitle,
        subtitle: newSubtitle,
        price: newPrice,
        imageId: newImageId,
        active: true,
        brand: activeBrand,
        isHero,
        mediaType
    };

    if (editingBanner) {
        updateDoc(doc(firestore, 'banners', editingBanner.id), bannerData)
            .then(() => {
                toast({ title: 'Banner Updated' });
                setIsAddDialogOpen(false);
                setEditingBanner(null);
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `banners/${editingBanner.id}`,
                    operation: 'update',
                    requestResourceData: bannerData
                }));
            })
            .finally(() => setIsSaving(false));
    } else {
        addDoc(collection(firestore, 'banners'), bannerData)
            .then(() => {
                toast({ title: 'Banner Published' });
                setIsAddDialogOpen(false);
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'banners',
                    operation: 'create',
                    requestResourceData: bannerData
                }));
            })
            .finally(() => setIsSaving(false));
    }
  };

  const handleToggleActive = (bannerId: string, current: boolean) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'banners', bannerId), { active: !current })
        .then(() => toast({ title: 'Status Updated' }))
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `banners/${bannerId}`,
                operation: 'update',
                requestResourceData: { active: !current }
            }));
        });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'banners', id))
        .then(() => toast({ title: 'Banner Removed' }))
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `banners/${id}`,
                operation: 'delete'
            }));
        });
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                {activeBrand === 'zapizza' ? 'Zapizza' : 'Zfry'} Banners
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage promotional carousels and header backgrounds</p>
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
          <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                {editingBanner ? 'Edit' : 'Add'} {activeBrand} Promo
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Master Media Component</DialogDescription>
            </DialogHeader>
            <div className="px-8 py-4 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border">
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-tight">Set as Header Hero</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Background for Homepage Header</span>
                </div>
                <Switch checked={isHero} onCheckedChange={setIsHero} />
              </div>

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
                <div className="flex justify-between items-end">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Media Visual (HD Photo/Video)</Label>
                    <Select value={mediaType} onValueChange={(v: any) => setMediaType(v)}>
                        <SelectTrigger className="h-7 w-24 text-[8px] font-black uppercase">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="image" className="text-[8px] font-black uppercase">Image</SelectItem>
                            <SelectItem value="video" className="text-[8px] font-black uppercase">Video</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="file" hidden ref={fileInputRef} accept="image/*,video/*" onChange={handleFileUpload} />
                    <Button 
                        variant="outline" 
                        className="h-11 rounded-xl font-black uppercase text-[9px] tracking-widest border-2"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="mr-2 h-3.5 w-3.5" /> Pick HD File
                    </Button>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input 
                            value={newImageId.startsWith('http') ? newImageId : ''} 
                            onChange={e => setNewImageId(e.target.value)} 
                            placeholder="Direct URL" 
                            className="pl-8 h-11 text-[10px] font-bold rounded-xl"
                        />
                    </div>
                </div>
                <div className="relative aspect-[21/9] rounded-[24px] overflow-hidden border-2 bg-muted/20 mt-2 shadow-inner">
                    {mediaType === 'video' ? (
                        <video src={newImageId} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                        <Image 
                            src={getImageUrl(newImageId)} 
                            alt="Preview" 
                            fill 
                            className="object-cover"
                        />
                    )}
                </div>
                <Select onValueChange={setNewImageId} value={newImageId.startsWith('data:') || newImageId.startsWith('http') ? 'custom' : newImageId}>
                    <SelectTrigger className="h-10 rounded-xl font-bold uppercase text-[9px]">
                        <SelectValue placeholder="Or select from library" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="banner_1">Promo Large</SelectItem>
                        <SelectItem value="banner_2">Cheese Lava</SelectItem>
                        <SelectItem value="banner_3">Dessert Special</SelectItem>
                        {(newImageId.startsWith('data:') || newImageId.startsWith('http')) && <SelectItem value="custom">Custom Asset Ready</SelectItem>}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/30 border-t flex gap-4">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
              <Button onClick={handleAddBanner} disabled={isSaving} style={{ backgroundColor: brandColor }} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl px-10">
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : (editingBanner ? 'Update and Publish' : 'Save and Publish')}
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
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Type</TableHead>
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
                      {banner.mediaType === 'video' ? (
                        <video src={banner.imageId} className="w-full h-full object-cover" muted />
                      ) : (
                        <Image
                            src={getImageUrl(banner.imageId)}
                            alt={banner.title || 'Banner'}
                            fill
                            className="object-cover"
                        />
                      )}
                      {banner.isHero && (
                        <div className="absolute top-1 right-1 bg-yellow-400 p-1 rounded-full shadow-md">
                            <Star className="h-2 w-2 text-black fill-current" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                        <p className="font-black uppercase text-[13px] tracking-tight italic text-[#333]">{banner.title || 'Untitled Promo'}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {banner.isHero ? 'Header Hero Background' : (banner.subtitle || 'General Awareness')}
                        </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase">{banner.mediaType || 'image'}</Badge>
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
                        onClick={() => handleDelete(banner.id)}
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
