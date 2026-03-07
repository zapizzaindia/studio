
"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, ImageIcon, Upload, Loader2, Link as LinkIcon, Smartphone, Timer } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import type { AppBanner } from '@/lib/types';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function FranchiseAppBannersPage() {
  const firestore = useFirestore();
  const { data: banners, loading } = useCollection<AppBanner>('appBanners');
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AppBanner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newUrl, setNewUrl] = useState("");
  const [newDeepLink, setNewDeepLink] = useState("");
  const [newDuration, setNewDuration] = useState("3");
  const [isActive, setIsActive] = useState(true);

  const handleEditClick = (banner: AppBanner) => {
    setEditingBanner(banner);
    setNewUrl(banner.imageUrl);
    setNewDeepLink(banner.deepLink || "");
    setNewDuration(banner.duration.toString());
    setIsActive(banner.isActive);
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewUrl(dataUrl);
      toast({ title: 'Visual Loaded', description: 'Banner ready for preview.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!firestore || !newUrl) return;

    setIsSaving(true);
    const bannerData = {
        imageUrl: newUrl,
        deepLink: newDeepLink,
        duration: Number(newDuration) || 3,
        isActive: isActive,
        createdAt: editingBanner ? editingBanner.createdAt : serverTimestamp()
    };

    if (editingBanner) {
        updateDoc(doc(firestore, 'appBanners', editingBanner.id), bannerData)
            .then(() => {
                toast({ title: 'Splash Updated' });
                setIsDialogOpen(false);
                setEditingBanner(null);
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `appBanners/${editingBanner.id}`,
                    operation: 'update',
                    requestResourceData: bannerData
                }));
            })
            .finally(() => setIsSaving(false));
    } else {
        addDoc(collection(firestore, 'appBanners'), bannerData)
            .then(() => {
                toast({ title: 'Splash Published' });
                setIsDialogOpen(false);
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'appBanners',
                    operation: 'create',
                    requestResourceData: bannerData
                }));
            })
            .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'appBanners', id))
        .then(() => toast({ title: 'Splash Removed' }))
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `appBanners/${id}`,
                operation: 'delete'
            }));
        });
  };

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic text-primary">
                Startup Splash
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage full-screen promotional banners shown on app open</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingBanner(null); }}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-8">
                <Plus className="mr-2 h-4 w-4" /> Create New Splash
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-primary">
                {editingBanner ? 'Edit' : 'Add'} Splash Banner
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Full-screen 9:16 Orientation Required</DialogDescription>
            </DialogHeader>
            
            <div className="px-8 py-4 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border">
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-tight">Active Status</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Toggle to show/hide on app start</span>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Banner Visual (9:16)</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                    <Button 
                        variant="outline" 
                        className="h-11 rounded-xl font-black uppercase text-[9px] tracking-widest border-2"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="mr-2 h-3.5 w-3.5" /> Pick Portrait Photo
                    </Button>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input 
                            value={newUrl} 
                            onChange={e => setNewUrl(e.target.value)} 
                            placeholder="Direct URL" 
                            className="pl-8 h-11 text-[10px] font-bold rounded-xl"
                        />
                    </div>
                </div>
                <div className="relative aspect-[9/16] max-h-[300px] mx-auto w-full rounded-[24px] overflow-hidden border-2 bg-muted/20 shadow-inner">
                    {newUrl ? (
                        <Image 
                            src={newUrl} 
                            alt="Preview" 
                            fill 
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                            <Smartphone className="h-12 w-12 opacity-20 mb-2" />
                            <span className="text-[8px] font-black uppercase">Preview Area</span>
                        </div>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1"><Timer className="h-3 w-3"/> Duration (Sec)</Label>
                    <Input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="font-bold h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Deep Link (Optional)</Label>
                    <Input value={newDeepLink} onChange={e => setNewDeepLink(e.target.value)} placeholder="/home/offers" className="font-bold h-12 rounded-xl" />
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-muted/30 border-t flex gap-4">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl px-10">
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : (editingBanner ? 'Update' : 'Save & Publish')}
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
                <TableHead className="w-[120px] font-black uppercase text-[10px] tracking-widest h-14 pl-8">Portrait</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Display Logic</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Target</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="py-8 px-8"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
              )) : banners && banners.length > 0 ? banners.map(banner => (
                <TableRow key={banner.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                  <TableCell className="pl-8 py-6">
                    <div className="relative h-24 w-16 rounded-xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5">
                        <Image
                            src={banner.imageUrl}
                            alt="Splash"
                            fill
                            className="object-cover"
                        />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                        <p className="font-black uppercase text-[13px] tracking-tight italic text-[#333]">Duration: {banner.duration}s</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {new Date(banner.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                        </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] font-black bg-muted px-2 py-1 rounded">{banner.deepLink || 'No Redirect'}</code>
                  </TableCell>
                  <TableCell>
                    <Switch 
                        checked={banner.isActive} 
                        onCheckedChange={(val) => updateDoc(doc(firestore!, 'appBanners', banner.id), { isActive: val })} 
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
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No splash banners configured</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
