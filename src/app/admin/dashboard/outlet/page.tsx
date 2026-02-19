
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Power, Loader2, Save } from 'lucide-react';
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
    // Using email as ID for Admin lookup as per the "Authorize" logic
    const profileId = user?.email?.toLowerCase().trim() || 'dummy';
    const { data: userProfile } = useDoc<UserProfile>('users', profileId);
    const outletId = userProfile?.outletId;
    const { data: outlet, loading } = useDoc<Outlet>('outlets', outletId || 'dummy');
    
    const [outletName, setOutletName] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [isOutletOpen, setIsOutletOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (outlet) {
            setOutletName(outlet.name);
            setOpeningTime(outlet.openingTime || "11:00");
            setClosingTime(outlet.closingTime || "23:00");
            setIsOutletOpen(outlet.isOpen);
        }
    }, [outlet]);
    
    const handleSaveChanges = () => {
        if (!firestore || !outletId) return;
        setIsSaving(true);

        const outletRef = doc(firestore, 'outlets', outletId);
        const updatedData = {
            name: outletName,
            isOpen: isOutletOpen,
            openingTime,
            closingTime,
        };

        // Non-blocking mutation
        updateDoc(outletRef, updatedData)
            .then(() => {
                toast({ title: 'Success', description: 'Outlet details synchronized with master database.' });
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
                <div className="mb-8">
                    <Skeleton className="h-10 w-1/2 rounded-xl" />
                    <Skeleton className="h-4 w-1/3 mt-2 rounded-lg" />
                </div>
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-gray-50/50 p-8"><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-14 w-32 rounded-xl" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-0 max-w-2xl">
            <div className="mb-8 bg-white p-6 rounded-[32px] border shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-[#14532d]">Kitchen Profile</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Configure your outlet's local identity and timings</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#14532d]/10 flex items-center justify-center text-[#14532d]">
                    <Clock className="h-6 w-6" />
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                    <CardTitle className="text-xl font-black uppercase tracking-tight italic text-[#333]">{outlet?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
                        <MapPin className="h-3 w-3" />
                        <span>Authorized Node: {outletId}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between rounded-[24px] border p-6 bg-gray-50/50 group transition-all">
                        <div className="flex items-center space-x-4">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                                isOutletOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            )}>
                                <Power className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">Kitchen Live Status</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                    {isOutletOpen ? "Accepting incoming orders" : "Temporarily closed for orders"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isOutletOpen}
                            onCheckedChange={setIsOutletOpen}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Outlet Public Name</Label>
                        <Input 
                            value={outletName} 
                            onChange={(e) => setOutletName(e.target.value)} 
                            className="h-12 rounded-xl font-black text-lg"
                            placeholder="e.g. Zapizza Rudrapur"
                        />
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Operating Windows</Label>
                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <span className="text-[8px] font-black text-muted-foreground uppercase">Opens At</span>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} className="pl-10 h-12 rounded-xl font-bold"/>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[8px] font-black text-muted-foreground uppercase">Closes At</span>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} className="pl-10 h-12 rounded-xl font-bold"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                        <Button 
                            onClick={handleSaveChanges} 
                            disabled={isSaving}
                            className="h-14 px-10 rounded-2xl bg-[#14532d] hover:bg-[#0f4023] text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                        >
                            {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            Update Outlet Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
