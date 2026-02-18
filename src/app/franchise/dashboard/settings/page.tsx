
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc, useFirestore } from '@/firebase';
import type { GlobalSettings } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Percent, Truck, Crown, Save, Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function GlobalSettingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { data: settings, loading } = useDoc<GlobalSettings>('settings', 'global');
    
    const [gst, setGst] = useState(18);
    const [deliveryFee, setDeliveryFee] = useState(40);
    const [freeThreshold, setFreeThreshold] = useState(500);
    const [loyaltyRatio, setLoyaltyRatio] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setGst(settings.gstPercentage);
            setDeliveryFee(settings.deliveryFee);
            setFreeThreshold(settings.minOrderForFreeDelivery);
            setLoyaltyRatio(settings.loyaltyRatio);
        }
    }, [settings]);

    const handleSave = () => {
        if (!firestore) return;
        setIsSaving(true);

        const updatedData: GlobalSettings = {
            gstPercentage: Number(gst),
            deliveryFee: Number(deliveryFee),
            minOrderForFreeDelivery: Number(freeThreshold),
            loyaltyRatio: Number(loyaltyRatio),
        };

        const settingsRef = doc(firestore, 'settings', 'global');

        setDoc(settingsRef, updatedData)
            .then(() => {
                toast({ title: "Settings Updated", description: "Global business rules have been synced to the cloud." });
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'write',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    if (loading) return (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary h-10 w-10" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing with Backend...</p>
        </div>
    );

    return (
        <div className="container mx-auto max-w-4xl p-0">
            <div className="mb-8 bg-white p-6 rounded-[32px] border shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-primary">Global Business Rules</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Configure tax, delivery, and loyalty for all brands</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Save className="h-6 w-6" />
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-8">
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic">
                            <Percent className="h-5 w-5 text-primary" /> Tax Configuration
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Set applicable GST for all menu orders</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Current GST Rate (%)</Label>
                            <Input 
                                type="number" 
                                value={gst} 
                                onChange={e => setGst(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg"
                            />
                            <p className="text-[10px] text-muted-foreground font-medium italic">
                                Note: This value is used to calculate tax on the Checkout page in real-time.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-8">
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic">
                            <Truck className="h-5 w-5 text-primary" /> Delivery Logistics
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Charges and free shipping thresholds</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 grid gap-8 sm:grid-cols-2">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Base Delivery Fee (₹)</Label>
                            <Input 
                                type="number" 
                                value={deliveryFee} 
                                onChange={e => setDeliveryFee(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Free Delivery Above (₹)</Label>
                            <Input 
                                type="number" 
                                value={freeThreshold} 
                                onChange={e => setFreeThreshold(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-8">
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic">
                            <Crown className="h-5 w-5 text-primary" /> Loyalty Program
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Customer point accumulation rules</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Points per ₹100 spent</Label>
                            <Input 
                                type="number" 
                                value={loyaltyRatio} 
                                onChange={e => setLoyaltyRatio(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg"
                            />
                            <p className="text-[10px] text-muted-foreground font-bold italic">
                                Current Rule: A ₹1,000 order earns {Math.floor(10 * loyaltyRatio)} points.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-6 pb-12">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="font-black uppercase tracking-widest px-12 h-16 rounded-2xl shadow-xl text-lg transition-all active:scale-95"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                        {isSaving ? "Syncing..." : "Apply Global Rules"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
