'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Power } from 'lucide-react';
import { useDoc, useUser, useFirestore } from '@/firebase';
import type { UserProfile, Outlet } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminOutletPage() {
    const { user } = useUser();
    const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
    const outletId = userProfile?.outletId;
    const { data: outlet, loading } = useDoc<Outlet>('outlets', outletId || 'dummy');
    
    const [outletName, setOutletName] = useState("");
    const [city, setCity] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [isOutletOpen, setIsOutletOpen] = useState(true);
    
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (outlet) {
            setOutletName(outlet.name);
            // We'd need to fetch the city name based on cityId
            setCity(outlet.cityId); 
            setOpeningTime(outlet.openingTime || "11:00");
            setClosingTime(outlet.closingTime || "23:00");
            setIsOutletOpen(outlet.isOpen);
        }
    }, [outlet]);
    
    const handleSaveChanges = () => {
        if (!firestore || !outletId) return;

        const outletRef = doc(firestore, 'outlets', outletId);
        const updatedData = {
            name: outletName,
            isOpen: isOutletOpen,
            openingTime,
            closingTime,
        };

        updateDoc(outletRef, updatedData)
            .then(() => {
                toast({ title: 'Success', description: 'Outlet details updated successfully.' });
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: outletRef.path,
                    operation: 'update',
                    requestResourceData: updatedData
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }

    if (loading) {
        return (
             <div className="container mx-auto p-0">
                <div className="mb-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-4 w-1/3 mt-2" />
                </div>
                <Card className="max-w-2xl">
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-24" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-0">
            <div className="mb-4">
                <h1 className="font-headline text-3xl font-bold">Outlet Profile</h1>
                <p className="text-muted-foreground">Manage your outlet's information and status.</p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{outlet?.name}</CardTitle>
                    <CardDescription>
                        <div className="flex items-center gap-2 text-muted-foreground mt-2">
                            <MapPin className="h-4 w-4"/>
                            <span>{city}</span>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center space-x-3">
                            <Power className={`h-6 w-6 ${isOutletOpen ? 'text-green-500' : 'text-red-500'}`} />
                            <div>
                                <h3 className="font-medium">Outlet Status</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isOutletOpen ? "Accepting orders" : "Currently closed"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isOutletOpen}
                            onCheckedChange={setIsOutletOpen}
                            disabled // Franchise owner should control this from their dashboard
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Outlet Name</Label>
                        <Input value={outletName} onChange={(e) => setOutletName(e.target.value)} />
                    </div>

                    <div className="space-y-4">
                        <Label>Operating Hours</Label>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground"/>
                                <span className="text-sm text-muted-foreground">From</span>
                            </div>
                            <Input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} className="w-32"/>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">To</span>
                            </div>
                            <Input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} className="w-32"/>
                        </div>
                    </div>
                    
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </CardContent>
            </Card>
        </div>
    );
}
