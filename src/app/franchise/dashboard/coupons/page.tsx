
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pizza, Flame, IndianRupee } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { doc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Coupon, Brand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function FranchiseCouponsPage() {
    const { data: allCoupons, loading } = useCollection<Coupon>('coupons');
    const firestore = useFirestore();
    const { toast } = useToast();

    const [activeBrand, setActiveBrand] = useState<Brand>('zapizza');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
    const [newValue, setNewValue] = useState("");
    const [newMinOrder, setNewMinOrder] = useState("");
    const [newDescription, setNewDescription] = useState("");

    const coupons = useMemo(() => allCoupons?.filter(c => c.brand === activeBrand) || [], [allCoupons, activeBrand]);
    const brandColor = activeBrand === 'zfry' ? '#e31837' : '#14532d';

    const handleAddCoupon = async () => {
        if (!firestore || !newCode || !newValue) return;

        const couponData = {
            code: newCode.toUpperCase(),
            discountType: newType,
            discountValue: Number(newValue),
            minOrderAmount: Number(newMinOrder) || 0,
            active: true,
            description: newDescription,
            brand: activeBrand
        };

        try {
            await addDoc(collection(firestore, 'coupons'), couponData);
            toast({ title: `${activeBrand.toUpperCase()} Coupon Created`, description: `${newCode} is now active.` });
            setIsAddOpen(false);
            setNewCode(""); setNewValue(""); setNewMinOrder(""); setNewDescription("");
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
        <div className="container mx-auto p-0 space-y-8">
            {/* Brand Selection Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                        {activeBrand === 'zapizza' ? 'Zapizza' : 'Zfry'} Marketing
                    </h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage discount codes and promotions</p>
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
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button style={{ backgroundColor: brandColor }} className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-8">
                            <Plus className="mr-2 h-4 w-4" /> New {activeBrand.toUpperCase()} Promo Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="p-8 pb-4">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                                Create {activeBrand} Offer
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Global Marketing Configuration</DialogDescription>
                        </DialogHeader>
                        <div className="px-8 py-4 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Coupon Code</Label>
                                <Input 
                                    placeholder="e.g. ZAPIZZA50" 
                                    value={newCode} 
                                    onChange={e => setNewCode(e.target.value)}
                                    className="font-black h-12 rounded-xl text-lg tracking-widest"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Discount Type</Label>
                                    <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
                                        <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage" className="text-[10px] font-bold uppercase">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed" className="text-[10px] font-bold uppercase">Fixed (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Discount Value</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="Value" 
                                        value={newValue} 
                                        onChange={e => setNewValue(e.target.value)}
                                        className="h-12 rounded-xl font-black"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Min. Cart Value (₹)</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={newMinOrder} 
                                        onChange={e => setNewMinOrder(e.target.value)}
                                        className="pl-10 h-12 rounded-xl font-black"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Customer Description</Label>
                                <Textarea 
                                    placeholder="Tell the user why this offer is great..." 
                                    value={newDescription} 
                                    onChange={e => setNewDescription(e.target.value)}
                                    className="h-24 rounded-xl font-medium"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-8 bg-muted/30 border-t flex gap-4">
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
                            <Button onClick={handleAddCoupon} style={{ backgroundColor: brandColor }} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl px-10">Publish Offer</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b-gray-100 hover:bg-transparent">
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pl-8">Promo Code</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Benefits</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Cart Rules</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="py-8 px-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                            ) : coupons.length > 0 ? coupons.map(coupon => (
                                <TableRow key={coupon.id} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="pl-8 py-6">
                                        <Badge variant="outline" className="font-black py-1.5 px-4 border-2 border-dashed uppercase tracking-widest text-[13px] italic" style={{ borderColor: brandColor + '40', color: brandColor }}>
                                            {coupon.code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="font-black uppercase text-sm">{coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold line-clamp-1 max-w-xs">{coupon.description || 'General Discount'}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                        Min order: ₹{coupon.minOrderAmount}
                                    </TableCell>
                                    <TableCell>
                                        <Switch checked={coupon.active} />
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex gap-2 justify-end">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl bg-gray-50 text-red-500 hover:bg-red-50 hover:shadow-md transition-all"
                                                onClick={() => handleDelete(coupon.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No promo codes active for {activeBrand.toUpperCase()}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
