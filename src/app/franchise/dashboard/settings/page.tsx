
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDoc, useFirestore } from '@/firebase';
import type { GlobalSettings, DistanceSlab } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Percent, Truck, Crown, Save, Loader2, Plus, Trash2, MapPin } from 'lucide-react';
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
    const [maxRadius, setMaxRadius] = useState(10);
    const [slabs, setSlabs] = useState<DistanceSlab[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setGst(settings.gstPercentage);
            setDeliveryFee(settings.deliveryFee);
            setFreeThreshold(settings.minOrderForFreeDelivery);
            setLoyaltyRatio(settings.loyaltyRatio);
            setMaxRadius(settings.maxDeliveryRadius || 10);
            setSlabs(settings.distanceSlabs || []);
        }
    }, [settings]);

    const handleAddSlab = () => {
        setSlabs([...slabs, { upToKm: 0, fee: 0 }]);
    };

    const handleRemoveSlab = (index: number) => {
        setSlabs(slabs.filter((_, i) => i !== index));
    };

    const handleSlabChange = (index: number, field: keyof DistanceSlab, value: number) => {
        const updated = [...slabs];
        updated[index] = { ...updated[index], [field]: value };
        setSlabs(updated);
    };

    const handleSave = () => {
        if (!firestore) return;
        setIsSaving(true);

        // Sort slabs by distance before saving for easier processing on checkout
        const sortedSlabs = [...slabs].sort((a, b) => a.upToKm - b.upToKm);

        const updatedData: GlobalSettings = {
            gstPercentage: Number(gst),
            deliveryFee: Number(deliveryFee),
            minOrderForFreeDelivery: Number(freeThreshold),
            loyaltyRatio: Number(loyaltyRatio),
            maxDeliveryRadius: Number(maxRadius),
            distanceSlabs: sortedSlabs,
        };

        const settingsRef = doc(firestore, 'settings', 'global');

        setDoc(settingsRef, updatedData)
            .then(() => {
                toast({ title: "Settings Updated", description: "Global business rules and logistics have been synced." });
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
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground font-headline">Syncing with Backend...</p>
        </div>
    );

    return (
        <div className="container mx-auto max-w-4xl p-0">
            <div className="mb-8 bg-white p-6 rounded-[32px] border shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-primary">Global Business Rules</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 font-headline">Configure tax, delivery, and loyalty for all brands</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Save className="h-6 w-6" />
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-8">
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic text-[#333] font-headline">
                            <Percent className="h-5 w-5 text-primary" /> Tax Configuration
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest font-headline">Set applicable GST for all menu orders</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] font-headline">Current GST Rate (%)</Label>
                            <Input 
                                type="number" 
                                value={gst} 
                                onChange={e => setGst(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg font-roboto tabular-nums"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-8">
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic text-[#333] font-headline">
                            <Truck className="h-5 w-5 text-primary" /> Smart Logistics & Geofencing
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest font-headline">Distance-based pricing and operational radius</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 font-roboto">
                        <div className="grid gap-8 sm:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Max Delivery Radius (KM)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        type="number" 
                                        value={maxRadius} 
                                        onChange={e => setMaxRadius(Number(e.target.value))} 
                                        className="pl-10 h-12 rounded-xl font-black text-lg tabular-nums"
                                    />
                                </div>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase">Orders beyond this distance will be blocked at checkout.</p>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Free Delivery Above (₹)</Label>
                                <Input 
                                    type="number" 
                                    value={freeThreshold} 
                                    onChange={e => setFreeThreshold(Number(e.target.value))} 
                                    className="h-12 rounded-xl font-black text-lg tabular-nums"
                                />
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Distance Slabs (Pricing Tiers)</Label>
                                <Button variant="outline" size="sm" onClick={handleAddSlab} className="h-8 font-black uppercase text-[10px] tracking-widest border-2">
                                    <Plus className="h-3 w-3 mr-1" /> Add Slab
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {slabs.length === 0 && (
                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">No slabs defined. Using flat fallback fee.</p>
                                    </div>
                                )}
                                {slabs.map((slab, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground">Up to distance (KM)</span>
                                            <Input 
                                                type="number" 
                                                value={slab.upToKm} 
                                                onChange={e => handleSlabChange(idx, 'upToKm', Number(e.target.value))} 
                                                className="h-9 font-bold tabular-nums"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground">Fee (₹)</span>
                                            <Input 
                                                type="number" 
                                                value={slab.fee} 
                                                onChange={e => handleSlabChange(idx, 'fee', Number(e.target.value))} 
                                                className="h-9 font-bold tabular-nums"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSlab(idx)} className="mt-4 text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Base / Fallback Delivery Fee (₹)</Label>
                            <Input 
                                type="number" 
                                value={deliveryFee} 
                                onChange={e => setDeliveryFee(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg tabular-nums"
                            />
                            <p className="text-[8px] font-bold text-muted-foreground uppercase italic">Used if distance cannot be calculated or doesn't match a slab.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-8">
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic text-[#333] font-headline">
                            <Crown className="h-5 w-5 text-primary" /> Loyalty Program
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest font-headline">Customer point accumulation rules</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] font-headline">Points per ₹100 spent</Label>
                            <Input 
                                type="number" 
                                value={loyaltyRatio} 
                                onChange={e => setLoyaltyRatio(Number(e.target.value))} 
                                className="h-12 rounded-xl font-black text-lg font-roboto tabular-nums"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-6 pb-12 font-headline">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="font-black uppercase tracking-widest px-12 h-16 rounded-2xl shadow-xl text-lg transition-all active:scale-95 border-none"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                        Apply Global Rules
                    </Button>
                </div>
            </div>
        </div>
    );
}
