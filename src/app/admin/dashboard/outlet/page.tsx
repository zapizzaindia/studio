'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Power } from 'lucide-react';

export default function AdminOutletPage() {
    const [outletName, setOutletName] = useState("Zapizza - Downtown NYC");
    const [city, setCity] = useState("New York");
    const [openingTime, setOpeningTime] = useState("11:00");
    const [closingTime, setClosingTime] = useState("23:00");
    const [isOutletOpen, setIsOutletOpen] = useState(true);

    return (
        <div className="container mx-auto p-0">
            <div className="mb-4">
                <h1 className="font-headline text-3xl font-bold">Outlet Profile</h1>
                <p className="text-muted-foreground">Manage your outlet's information and status.</p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{outletName}</CardTitle>
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
                    
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>
        </div>
    );
}
