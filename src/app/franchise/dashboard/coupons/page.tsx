
'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ticket, Trash2, Edit } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { doc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Coupon } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function FranchiseCouponsPage() {
    const { data: coupons, loading } = useCollection<Coupon>('coupons');
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
    const [newValue, setNewValue] = useState("");
    const [newMinOrder, setNewMinOrder] = useState("");

    const handleAddCoupon = async () => {
        if (!firestore || !newCode || !newValue) return;

        const couponData = {
            code: newCode.toUpperCase(),
            discountType: newType,
            discountValue: Number(newValue),
            minOrderAmount: Number(newMinOrder) || 0,
            active: true
        };

        try {
            await addDoc(collection(firestore, 'coupons'), couponData);
            toast({ title: "Coupon Created", description: `${newCode} is now active.` });
            setIsAddOpen(false);
            setNewCode(""); setNewValue(""); setNewMinOrder("");
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'coupons', id));
            toast({ title: "Coupon Deleted" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        }
    };

    return (
        <div className="container mx-auto p-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Marketing Coupons</h1>
                    <p className="text-muted-foreground">Create discount codes for customer promotions.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#14532d] hover:bg-[#0f4023]">
                            <Plus className="mr-2 h-4 w-4" /> New Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Ticket className="h-5 w-5" /> Create Promo Code
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Coupon Code</Label>
                                <Input 
                                    placeholder="e.g. ZAPIZZA50" 
                                    value={newCode} 
                                    onChange={e => setNewCode(e.target.value)}
                                    className="font-black"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Value</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="Value" 
                                        value={newValue} 
                                        onChange={e => setNewValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Min Order Amount (₹)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={newMinOrder} 
                                    onChange={e => setNewMinOrder(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddCoupon} className="w-full h-12">Publish Coupon</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Usage Rules</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                            ) : coupons?.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell>
                                        <Badge variant="outline" className="font-black py-1 px-3 border-[#14532d] text-[#14532d]">
                                            {coupon.code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        Min order: ₹{coupon.minOrderAmount}
                                    </TableCell>
                                    <TableCell>
                                        <Switch checked={coupon.active} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-destructive"
                                            onClick={() => handleDelete(coupon.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
