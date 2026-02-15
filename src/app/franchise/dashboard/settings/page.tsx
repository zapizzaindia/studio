
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDoc, useFirestore } from '@/firebase';
import type { GlobalSettings } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Percent, Truck, Crown, Save, Loader2 } from 'lucide-react';

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

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);

        const updatedData: GlobalSettings = {
            gstPercentage: Number(gst),
            deliveryFee: Number(deliveryFee),
            minOrderForFreeDelivery: Number(freeThreshold),
            loyaltyRatio: Number(loyaltyRatio),
        };

        try {
            await setDoc(doc(firestore, 'settings', 'global'), updatedData);
            toast({ title: "Settings Updated", description: "Global business rules have been synced." });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    return (
        <div className="container mx-auto max-w-4xl p-0">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold">Global Business Settings</h1>
                <p className="text-muted-foreground">Configure tax, delivery, and loyalty rules for the entire franchise.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-primary" /> Tax Configuration
                        </CardTitle>
                        <CardDescription>Set the applicable GST percentage for all orders.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>GST Percentage (%)</Label>
                            <Input 
                                type="number" 
                                value={gst} 
                                onChange={e => setGst(Number(e.target.value))} 
                                placeholder="18"
                            />
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                Total GST will be split into 50% CGST and 50% SGST on receipts.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" /> Delivery Logistics
                        </CardTitle>
                        <CardDescription>Manage delivery charges and free shipping thresholds.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Base Delivery Fee (₹)</Label>
                            <Input 
                                type="number" 
                                value={deliveryFee} 
                                onChange={e => setDeliveryFee(Number(e.target.value))} 
                                placeholder="40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Free Delivery Threshold (₹)</Label>
                            <Input 
                                type="number" 
                                value={freeThreshold} 
                                onChange={e => setFreeThreshold(Number(e.target.value))} 
                                placeholder="500"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-primary" /> Loyalty Program
                        </CardTitle>
                        <CardDescription>Configure how customers earn points.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Points per ₹100 Spent</Label>
                            <Input 
                                type="number" 
                                value={loyaltyRatio} 
                                onChange={e => setLoyaltyRatio(Number(e.target.value))} 
                                placeholder="1"
                            />
                            <p className="text-[10px] text-muted-foreground font-bold">
                                Example: If set to 1, a ₹500 order earns 5 loyalty points.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button 
                        size="lg" 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="font-black uppercase tracking-widest px-10 h-14"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Apply Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
