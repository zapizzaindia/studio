
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CreditCard, ChevronRight, Plus, Minus, Trash2, Ticket, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { GlobalSettings, Coupon } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, totalPrice, updateQuantity, clearCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  
  const { data: settings } = useDoc<GlobalSettings>('settings', 'global');
  const { data: coupons } = useCollection<Coupon>('coupons', { where: ['active', '==', true] });

  const [isPlacing, setIsPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Dynamic calculations based on global settings
  const calculations = useMemo(() => {
    const subtotal = totalPrice;
    const gstRate = settings?.gstPercentage || 18;
    const baseDelivery = settings?.deliveryFee || 40;
    const freeThreshold = settings?.minOrderForFreeDelivery || 500;
    
    const deliveryFee = subtotal >= freeThreshold ? 0 : baseDelivery;
    const gstTotal = (subtotal * gstRate) / 100;
    
    // CGST and SGST split (standard Indian practice)
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discount = (subtotal * appliedCoupon.discountValue) / 100;
      } else {
        discount = appliedCoupon.discountValue;
      }
    }

    const finalTotal = subtotal + gstTotal + deliveryFee - discount;

    return { subtotal, cgst, sgst, deliveryFee, gstTotal, discount, finalTotal };
  }, [totalPrice, settings, appliedCoupon]);

  const handleApplyCoupon = () => {
    const found = coupons?.find(c => c.code === couponInput.toUpperCase());
    if (!found) {
      toast({ variant: 'destructive', title: "Invalid Code", description: "This coupon does not exist or is expired." });
      return;
    }
    if (totalPrice < found.minOrderAmount) {
      toast({ variant: 'destructive', title: "Below Min Order", description: `Add ₹${found.minOrderAmount - totalPrice} more to use this coupon.` });
      return;
    }
    setAppliedCoupon(found);
    toast({ title: "Coupon Applied!", description: `You saved ₹${found.discountType === 'percentage' ? found.discountValue + '%' : found.discountValue}.` });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Please login", variant: "destructive" });
      router.push('/login');
      return;
    }

    if (!db) return;
    setIsPlacing(true);
    
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    const outlet = savedOutlet ? JSON.parse(savedOutlet) : { id: 'default' };

    const orderData = {
      customerId: user.uid,
      customerName: user.displayName || user.email || "Customer",
      items: items.map(i => ({
        menuItemId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      subtotal: calculations.subtotal,
      gst: calculations.gstTotal,
      deliveryFee: calculations.deliveryFee,
      discount: calculations.discount,
      total: calculations.finalTotal,
      status: "New",
      createdAt: serverTimestamp(),
      outletId: outlet.id
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      router.push('/home/checkout/success');
    } catch (e: any) {
      toast({ title: "Order Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <Trash2 className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-black text-[#14532d] uppercase italic mb-2">Your cart is empty</h2>
        <Button onClick={() => router.push('/home/menu')} className="bg-[#14532d] text-white px-8 h-12 font-black uppercase tracking-widest rounded-xl">
          GO TO MENU
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-32">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black text-[#14532d] uppercase tracking-widest">Review Order</h1>
      </div>

      <div className="container mx-auto p-4 space-y-4 max-w-lg">
        {/* Order Items */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black text-[#14532d] uppercase tracking-widest">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {items.map((item) => (
              <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 border flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-[#333333] uppercase leading-tight">{item.name}</h4>
                    <span className="text-[11px] font-bold text-[#14532d] mt-1 block">₹{item.price * item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#f1f2f6] rounded-lg px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus className="h-3 w-3" /></button>
                  <span className="text-sm font-black min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Coupon Section */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
               <Ticket className="h-4 w-4 text-[#14532d]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[#14532d]">Offers & Coupons</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-[#14532d]/5 p-3 rounded-lg border border-dashed border-[#14532d]/30">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#14532d]" />
                  <span className="text-xs font-black uppercase text-[#14532d]">{appliedCoupon.code} applied!</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="h-7 text-[9px] font-black text-red-600">REMOVE</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input 
                  placeholder="ENTER PROMO CODE" 
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  className="h-10 text-xs font-black uppercase tracking-widest"
                />
                <Button onClick={handleApplyCoupon} className="bg-[#14532d] text-white font-black text-[10px] px-6">APPLY</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Details */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black text-[#14532d] uppercase tracking-widest">Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 bg-white">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <span>Item Total</span>
              <span>₹{calculations.subtotal}</span>
            </div>
            {calculations.discount > 0 && (
              <div className="flex justify-between text-xs font-black text-green-600 uppercase">
                <span>Coupon Discount</span>
                <span>-₹{calculations.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <span>Delivery Partner Fee</span>
              <span className={calculations.deliveryFee === 0 ? "text-green-600" : ""}>
                {calculations.deliveryFee === 0 ? "FREE" : `₹${calculations.deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase">
              <span>Taxes (CGST + SGST @ {settings?.gstPercentage || 18}%)</span>
              <span>₹{calculations.gstTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed pt-3 flex justify-between text-lg font-black text-[#333333]">
              <span>TO PAY</span>
              <span className="text-[#14532d]">₹{Math.round(calculations.finalTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="bg-[#14532d] p-4 rounded-xl flex items-center gap-3 shadow-lg">
           <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
           </div>
           <div>
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Loyalty Reward</p>
              <p className="text-xs font-black text-white uppercase italic">
                You will earn {Math.floor((calculations.subtotal / 100) * (settings?.loyaltyRatio || 1))} points
              </p>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#14532d]" />
            <span className="text-[11px] font-black uppercase text-[#333333]">Cash on Delivery</span>
          </div>
        </div>
        <Button 
          onClick={handlePlaceOrder}
          disabled={isPlacing}
          className="w-full h-14 bg-[#e31837] hover:bg-[#c61430] text-white text-lg font-black uppercase tracking-widest rounded-xl shadow-lg"
        >
          {isPlacing ? <Loader2 className="animate-spin h-6 w-6" /> : `PAY ₹${Math.round(calculations.finalTotal)}`}
        </Button>
      </div>
    </div>
  );
}
