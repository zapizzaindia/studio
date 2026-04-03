
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Power, Loader2, Save, Phone } from 'lucide-react';
import { useDoc, useUser, useFirestore } from '@/firebase';
import type { UserProfile, Outlet } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

export default function AdminOutletPage() {
    const { user } = useUser();
    const profileId = user?.email?.toLowerCase().trim() || 'dummy';
    const { data: userProfile } = useDoc<UserProfile>('users', profileId);
    const outletId = userProfile?.outletId;
    const { data: outlet, loading } = useDoc<Outlet>('outlets', outletId || 'dummy');
    
    const [outletName, setOutletName] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [outletPhone, setOutletPhone] = useState("");
    const [isOutletOpen, setIsOutletOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const db = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (outlet) {
            setOutletName(outlet.name);
            setOpeningTime(outlet.openingTime || "11:00");
            setClosingTime(outlet.closingTime || "23:00");
            setOutletPhone(outlet.phone || "");
            setIsOutletOpen(outlet.isOpen);
        }
    }, [outlet]);
    
    const handleSaveChanges = () => {
        if (!db || !outletId || outletId === 'dummy') {
            toast({ variant: 'destructive', title: 'Error', description: 'Outlet ID not found.' });
            return;
        }
        
        setIsSaving(true);

        const outletRef = doc(db, 'outlets', outletId);
        const updatedData = {
            name: outletName,
            isOpen: isOutletOpen,
            openingTime,
            closingTime,
            phone: outletPhone,
        };

        updateDoc(outletRef, updatedData)
            .then(() => {
                toast({ title: 'Success', description: 'Outlet details updated.' });
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: outletRef.path,
                    operation: 'update',
                    requestResourceData: updatedData
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    if (loading) {
        return (
             <div className="container mx-auto p-0 max-w-2xl">
                <div className="mb-6">
                    <Skeleton className="h-8 w-1/2 rounded-lg" />
                </div>
                <Card className="border-none shadow-md rounded-[24px] overflow-hidden">
                    <CardHeader className="bg-gray-50/50 p-6"><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-12 w-32 rounded-xl" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

    return (
        <div className="container mx-auto p-0 max-w-2xl">
            <div className="mb-6 bg-white p-4 rounded-[24px] border shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-2xl font-black uppercase tracking-tight italic" style={{ color: brandColor }}>Kitchen Profile</h1>
                    <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-0.5">Operating Parameters</p>
                </div>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor + '10', color: brandColor }}>
                    <Clock className="h-5 w-5" />
                </div>
            </div>

            <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 p-6 border-b">
                    <CardTitle className="text-lg font-black uppercase tracking-tight italic text-[#333]">{outlet?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        <MapPin className="h-2.5 w-2.5" />
                        <span>Outlet ID: {outletId}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between rounded-2xl border p-4 bg-gray-50/50">
                        <div className="flex items-center space-x-3">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                isOutletOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            )}>
                                <Power className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Live Status</h3>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">
                                    {isOutletOpen ? "Accepting Orders" : "Kitchen Closed"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isOutletOpen}
                            onCheckedChange={setIsOutletOpen}
                            className="data-[state=checked]:bg-green-500 scale-90"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Public Outlet Name</Label>
                        <Input 
                            value={outletName} 
                            onChange={(e) => setOutletName(e.target.value)} 
                            className="h-11 rounded-xl font-bold text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                            <Phone className="h-2.5 w-2.5" /> Contact Number
                        </Label>
                        <Input 
                            value={outletPhone} 
                            onChange={(e) => setOutletPhone(e.target.value)} 
                            placeholder="+91 XXXX XXX XXX"
                            className="h-11 rounded-xl font-bold text-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Operating Window</Label>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <span className="text-[7px] font-black text-muted-foreground uppercase">Opens</span>
                                <Input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} className="h-10 rounded-xl font-bold text-xs"/>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[7px] font-black text-muted-foreground uppercase">Closes</span>
                                <Input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} className="h-10 rounded-xl font-bold text-xs"/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-2 flex justify-end">
                        <Button 
                            onClick={handleSaveChanges} 
                            disabled={isSaving}
                            className="w-full h-12 px-8 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg"
                            style={{ backgroundColor: brandColor }}
                        >
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Sync Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
