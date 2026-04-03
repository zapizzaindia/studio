
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pizza, Flame, IndianRupee, ShieldAlert, Tag, Layers, CheckCircle2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { doc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Coupon, Brand, MenuItem, Category, CouponType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Checkbox } from '@/components/ui/checkbox';

export default function FranchiseCouponsPage() {
    const { data: allCoupons, loading } = useCollection<Coupon>('coupons');
    const { data: menuItems } = useCollection<MenuItem>('menuItems');
    const { data: categories } = useCollection<Category>('categories');
    const firestore = useFirestore();
    const { toast } = useToast();

    const [activeBrand, setActiveBrand] = useState<Brand>('zapizza');
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    // Form State
    const [newCode, setNewCode] = useState("");
    const [newType, setNewType] = useState<CouponType>('standard');
    const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [newValue, setNewValue] = useState("");
    const [newMinOrder, setNewMinOrder] = useState("");
    const [newMaxDiscount, setNewMaxDiscount] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    // Scheduling State
    const [newStartDate, setNewStartDate] = useState("");
    const [newEndDate, setNewEndDate] = useState("");
    const [newStartTime, setNewStartTime] = useState("");
    const [newEndTime, setNewEndTime] = useState("");

    const coupons = useMemo(() => allCoupons?.filter(c => c.brand === activeBrand) || [], [allCoupons, activeBrand]);
    const brandColor = activeBrand === 'zfry' ? '#e31837' : '#14532d';

    const brandItems = useMemo(() => menuItems?.filter(i => i.brand === activeBrand) || [], [menuItems, activeBrand]);
    const brandCategories = useMemo(() => categories?.filter(c => c.brand === activeBrand) || [], [categories, activeBrand]);

    const handleAddCoupon = async () => {
        if (!firestore || !newCode) return;

        const couponData = {
            code: newCode.toUpperCase(),
            type: newType,
            discountType: newType === 'bogo' ? 'percentage' : newDiscountType,
            discountValue: newType === 'bogo' ? 100 : Number(newValue),
            minOrderAmount: Number(newMinOrder) || 0,
            maxDiscountAmount: newMaxDiscount ? Number(newMaxDiscount) : null,
            active: true,
            description: newDescription,
            brand: activeBrand,
            eligibleItemIds: selectedItems.length > 0 ? selectedItems : null,
            eligibleCategoryIds: selectedCategories.length > 0 ? selectedCategories : null,
            startDate: newStartDate || null,
            endDate: newEndDate || null,
            startTime: newStartTime || null,
            endTime: newEndTime || null
        };

        try {
            await addDoc(collection(firestore, 'coupons'), couponData);
            toast({ title: `${activeBrand.toUpperCase()} Coupon Created`, description: `${newCode} is now active.` });
            setIsAddOpen(false);
            resetForm();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        }
    };

    const resetForm = () => {
        setNewCode(""); 
        setNewType('standard');
        setNewDiscountType('percentage');
        setNewValue(""); 
        setNewMinOrder(""); 
        setNewMaxDiscount(""); 
        setNewDescription("");
        setSelectedItems([]);
        setSelectedCategories([]);
        setNewStartDate("");
        setNewEndDate("");
        setNewStartTime("");
        setNewEndTime("");
    }

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 font-headline">
                <div>
                    <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                        {activeBrand === 'zapizza' ? 'Zapizza' : 'Zfry'} Marketing
                    </h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage targeted promos and BOGO deals</p>
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

            <div className="flex justify-end font-headline">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button style={{ backgroundColor: brandColor }} className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-8">
                            <Plus className="mr-2 h-4 w-4" /> New Targeted Offer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
                        <DialogHeader className="p-8 pb-4 bg-gray-50/50">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: brandColor }}>
                                Configure Campaign
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Define logic for specific items or categories</DialogDescription>
                        </DialogHeader>
                        
                        <div className="p-8 pt-4 space-y-6 overflow-y-auto font-headline">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Coupon Code</Label>
                                    <Input 
                                        placeholder="e.g. BOGOPIZZA" 
                                        value={newCode} 
                                        onChange={e => setNewCode(e.target.value)}
                                        className="font-black h-12 rounded-xl text-lg tracking-widest"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Offer Logic</Label>
                                    <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
                                        <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard" className="text-[10px] font-bold uppercase">Standard Discount</SelectItem>
                                            <SelectItem value="bogo" className="text-[10px] font-bold uppercase">Buy 1 Get 1 (BOGO)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {newType === 'standard' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Discount Type</Label>
                                        <Select value={newDiscountType} onValueChange={(val: any) => setNewDiscountType(val)}>
                                            <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
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
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Min. Order (₹)</Label>
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
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Max Savings Cap (₹)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="No Limit" 
                                        value={newMaxDiscount} 
                                        onChange={e => setNewMaxDiscount(e.target.value)}
                                        className="h-12 rounded-xl font-black"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-2xl border border-dashed">
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <CalendarIcon className="h-3 w-3" /> Date Validity
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <span className="text-[7px] font-black uppercase text-muted-foreground">Start</span>
                                            <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="h-10 text-[10px] font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[7px] font-black uppercase text-muted-foreground">End</span>
                                            <Input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} className="h-10 text-[10px] font-bold" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> Daily Time Slot
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <span className="text-[7px] font-black uppercase text-muted-foreground">From</span>
                                            <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="h-10 text-[10px] font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[7px] font-black uppercase text-muted-foreground">To</span>
                                            <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="h-10 text-[10px] font-bold" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-2xl border border-dashed">
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Layers className="h-3 w-3" /> Target Categories
                                    </Label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                                        {brandCategories.map(cat => (
                                            <div key={cat.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`cat-${cat.id}`} 
                                                    checked={selectedCategories.includes(cat.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setSelectedCategories([...selectedCategories, cat.id]);
                                                        else setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                                                    }}
                                                />
                                                <label htmlFor={`cat-${cat.id}`} className="text-[10px] font-bold uppercase cursor-pointer">{cat.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Tag className="h-3 w-3" /> Specific Items
                                    </Label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                                        {brandItems.map(item => (
                                            <div key={item.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`item-${item.id}`} 
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setSelectedItems([...selectedItems, item.id]);
                                                        else setSelectedItems(selectedItems.filter(id => id !== item.id));
                                                    }}
                                                />
                                                <label htmlFor={`item-${item.id}`} className="text-[10px] font-bold uppercase cursor-pointer line-clamp-1">{item.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Public Description</Label>
                                <Textarea 
                                    placeholder="e.g. Buy 1 Regular Pizza and Get 1 Free!" 
                                    value={newDescription} 
                                    onChange={e => setNewDescription(e.target.value)}
                                    className="h-20 rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-gray-50/50 border-t flex gap-4 shrink-0 font-headline">
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
                            <Button onClick={handleAddCoupon} style={{ backgroundColor: brandColor }} className="flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl px-10">Activate Campaign</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white font-headline">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b-gray-100 hover:bg-transparent">
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pl-8">Promo Identity</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Type & Targeting</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Benefit</TableHead>
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
                                        <div className="space-y-1">
                                            <Badge variant="secondary" className="text-[7px] font-black uppercase h-4">{coupon.type || 'Standard'}</Badge>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                {coupon.eligibleCategoryIds ? `${coupon.eligibleCategoryIds.length} Categories` : (coupon.eligibleItemIds ? `${coupon.eligibleItemIds.length} Items` : 'Global Storewide')}
                                            </p>
                                            {(coupon.startDate || coupon.endDate) && (
                                                <p className="text-[7px] font-bold text-orange-600 uppercase">
                                                    Dates: {coupon.startDate || 'Any'} to {coupon.endDate || 'Any'}
                                                </p>
                                            )}
                                            {(coupon.startTime || coupon.endTime) && (
                                                <p className="text-[7px] font-bold text-blue-600 uppercase">
                                                    Slot: {coupon.startTime || '00:00'} - {coupon.endTime || '23:59'}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="font-black uppercase text-sm">
                                                {coupon.type === 'bogo' ? 'Buy 1 Get 1 FREE' : (coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`)}
                                            </p>
                                            {coupon.maxDiscountAmount && <Badge className="bg-orange-50 text-orange-700 border-orange-100 text-[8px] font-black uppercase">Max ₹{coupon.maxDiscountAmount}</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Switch checked={coupon.active} />
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex gap-2 justify-end">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl bg-gray-50 text-red-500 hover:bg-red-50"
                                                onClick={() => handleDelete(coupon.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No active campaigns for {activeBrand.toUpperCase()}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
