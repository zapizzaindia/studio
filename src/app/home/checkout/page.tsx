
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CreditCard, ChevronRight, Plus, Minus, Trash2, Ticket, Check, Loader2, Crown, ShieldCheck, MapPinned, AlertTriangle, MessageSquareText, Wallet, IndianRupee as RupeeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, getDocs, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { GlobalSettings, Coupon, Address, Outlet, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, totalPrice, updateQuantity, clearCart, removeItem } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  
  // Fetch user profile to get the actual name provided during onboarding
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  const { data: settings } = useDoc<GlobalSettings>('settings', 'global');
  const { data: allCoupons } = useCollection<Coupon>('coupons', { where: ['active', '==', true] });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [specialNote, setSpecialNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Online" | "Cash">("Online");

  useEffect(() => {
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    if (savedOutlet) {
      try { setSelectedOutlet(JSON.parse(savedOutlet)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const fetchAddresses = async () => {
      const q = query(collection(db, `users/${user.uid}/addresses`));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault) || data[0];
      if (defaultAddr) setSelectedAddress(defaultAddr);
    };
    fetchAddresses();
  }, [user, db]);

  const brandCoupons = useMemo(() => {
    if (!selectedOutlet || !allCoupons) return [];
    return allCoupons.filter(c => c.brand === selectedOutlet.brand);
  }, [allCoupons, selectedOutlet]);

  const calculations = useMemo(() => {
    const subtotal = totalPrice;
    const gstRate = settings?.gstPercentage ?? 18;
    const baseDelivery = settings?.deliveryFee ?? 40;
    const freeThreshold = settings?.minOrderForFreeDelivery ?? 500;
    
    const deliveryFee = subtotal >= freeThreshold ? 0 : baseDelivery;
    const gstTotal = (subtotal * gstRate) / 100;
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discount = (subtotal * appliedCoupon.discountValue) / 100;
      } else {
        discount = appliedCoupon.discountValue;
      }
    }

    const finalTotal = subtotal + gstTotal + deliveryFee - discount;

    return { subtotal, deliveryFee, gstTotal, discount, finalTotal };
  }, [totalPrice, settings, appliedCoupon]);

  useEffect(() => {
    if (appliedCoupon && totalPrice < appliedCoupon.minOrderAmount) {
      setAppliedCoupon(null);
      toast({ 
        variant: 'destructive', 
        title: "Coupon Removed", 
        description: `Minimum order of ₹${appliedCoupon.minOrderAmount} required for ${appliedCoupon.code}` 
      });
    }
  }, [totalPrice, appliedCoupon, toast]);

  const handleApplyCoupon = (couponOrCode: Coupon | string) => {
    if (!selectedOutlet) return;
    
    let found: Coupon | undefined;
    if (typeof couponOrCode === 'string') {
      found = allCoupons?.find(c => 
        c.code === couponOrCode.toUpperCase() && 
        c.brand === selectedOutlet.brand
      );
    } else {
      found = couponOrCode;
    }

    if (!found) {
      toast({ variant: 'destructive', title: "Invalid Code", description: `This coupon does not exist or is not valid for ${selectedOutlet.brand.toUpperCase()}.` });
      return;
    }
    if (totalPrice < found.minOrderAmount) {
      toast({ variant: 'destructive', title: "Below Min Order", description: `Add ₹${found.minOrderAmount - totalPrice} more to use this coupon.` });
      return;
    }
    setAppliedCoupon(found);
    toast({ title: "Coupon Applied!", description: `You saved ₹${found.discountType === 'percentage' ? (totalPrice * found.discountValue / 100) : found.discountValue}` });
  };

  const handlePlaceOrder = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedAddress) {
      toast({ variant: 'destructive', title: "Address Required", description: "Please add a delivery address to continue." });
      return;
    }

    if (!db) return;
    setIsPlacing(true);
    
    const outlet = selectedOutlet || { id: 'default' };

    const orderData: any = {
      customerId: user.uid,
      customerName: userProfile?.displayName || user.displayName || "Gourmet Customer",
      customerPhone: userProfile?.phoneNumber || user.phoneNumber || "+91-0000000000",
      items: items.map(i => ({
        menuItemId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        variation: i.selectedVariation?.name || null,
        addons: i.selectedAddons?.map(a => a.name) || []
      })),
      subtotal: calculations.subtotal,
      gst: calculations.gstTotal,
      deliveryFee: calculations.deliveryFee,
      discount: calculations.discount,
      total: Math.round(calculations.finalTotal),
      status: "New",
      createdAt: serverTimestamp(),
      outletId: outlet.id,
      deliveryAddress: {
        label: selectedAddress.label,
        flatNo: selectedAddress.flatNo,
        area: selectedAddress.area,
        landmark: selectedAddress.landmark || null,
        city: selectedAddress.city,
        latitude: selectedAddress.latitude || null,
        longitude: selectedAddress.longitude || null
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'Online' ? "Success" : "Pending",
      paymentId: paymentMethod === 'Online' ? `pay_${Math.random().toString(36).substring(7)}` : null
    };

    if (specialNote.trim()) {
      orderData.specialNote = specialNote.trim();
    }

    const pointsEarned = Math.floor((calculations.subtotal / 100) * (settings?.loyaltyRatio ?? 1));

    if (paymentMethod === 'Online') {
        toast({ title: "Connecting to Secure Gateway...", description: "Processing your transaction..." });
    } else {
        toast({ title: "Submitting Order...", description: "Confirming your COD request..." });
    }

    addDoc(collection(db, 'orders'), orderData)
    .then(() => {
      // Update Loyalty Points in User Profile
      if (user && pointsEarned > 0) {
        updateDoc(doc(db, 'users', user.uid), {
          loyaltyPoints: increment(pointsEarned)
        }).catch(err => {
          console.error("Failed to update loyalty points", err);
        });
      }
      
      clearCart();
      router.push('/home/checkout/success');
    })
    .catch(async (error) => {
      console.error("Order error:", error);
      const permissionError = new FirestorePermissionError({
        path: 'orders',
        operation: 'create',
        requestResourceData: orderData,
      });
      errorEmitter.emit('permission-error', permissionError);
    })
    .finally(() => {
      setIsPlacing(false);
    });
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

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-48">
      <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black uppercase tracking-widest" style={{ color: brandColor }}>Review Order</h1>
      </div>

      <div className="container mx-auto p-4 space-y-4 max-w-lg text-left">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: brandColor }}>
              <MapPinned className="h-4 w-4" /> Delivery Address
            </CardTitle>
            <Button variant="link" size="sm" onClick={() => router.push('/home/addresses')} className="h-auto p-0 text-[10px] font-black uppercase" style={{ color: brandColor }}>CHANGE</Button>
          </CardHeader>
          <CardContent className="p-4 bg-white">
            {selectedAddress ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[8px] font-black uppercase" style={{ backgroundColor: brandColor + '10', color: brandColor }}>{selectedAddress.label}</Badge>
                  {selectedAddress.latitude && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 text-[8px] font-black uppercase">GPS PINNED</Badge>
                  )}
                </div>
                <p className="text-xs font-bold text-[#333333] leading-snug">{selectedAddress.flatNo}, {selectedAddress.area}</p>
                {selectedAddress.landmark && <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Landmark: {selectedAddress.landmark}</p>}
              </div>
            ) : (
              <Button onClick={() => router.push('/home/addresses')} variant="outline" className="w-full border-dashed font-black uppercase text-xs h-12" style={{ borderColor: brandColor, color: brandColor }}>
                + Add Delivery Address
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {items.map((item) => (
              <div key={item.cartId} className="p-4 border-b last:border-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 border flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-[#333333] uppercase leading-tight">{item.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedVariation && (
                        <span className="text-[9px] font-bold bg-[#f1f2f6] text-[#666666] px-1.5 py-0.5 rounded uppercase">{item.selectedVariation.name}</span>
                      )}
                      {item.selectedAddons?.map(addon => (
                        <span key={addon.name} className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: brandColor + '05', color: brandColor }}>+{addon.name}</span>
                      ))}
                    </div>
                    <span className="text-[11px] font-black mt-1.5 block" style={{ color: brandColor }}>₹{item.price * item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-[#f1f2f6] rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-black min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1"><Plus className="h-3 w-3" /></button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(item.cartId)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Special Cooking Note Section */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: brandColor }}>
              <MessageSquareText className="h-4 w-4" /> Cooking Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-white">
            <Textarea 
              placeholder="e.g. Please make it extra spicy, or don't ring the doorbell..." 
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="min-h-[80px] rounded-xl font-medium text-xs border-gray-100 bg-gray-50/50"
            />
            <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-tight">Your note will be visible to the chef & rider.</p>
          </CardContent>
        </Card>

        {/* Available Coupons Horizontal Scroll */}
        {brandCoupons.length > 0 && !appliedCoupon && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: brandColor }}>Available Coupons</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
              {brandCoupons.map((coupon) => (
                <div 
                  key={coupon.id}
                  onClick={() => handleApplyCoupon(coupon)}
                  className="flex-shrink-0 w-48 bg-white rounded-xl border border-dashed p-3 relative cursor-pointer active:scale-95 transition-all shadow-sm"
                  style={{ borderColor: brandColor + '40' }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: brandColor }}>{coupon.code}</span>
                    <Badge variant="outline" className="text-[8px] font-bold h-4 px-1" style={{ borderColor: brandColor + '20', color: brandColor }}>
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </Badge>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-bold leading-tight line-clamp-1">{coupon.description}</p>
                  {totalPrice < coupon.minOrderAmount && (
                    <p className="text-[8px] text-red-500 font-black mt-1 uppercase italic tracking-tight">Add ₹{coupon.minOrderAmount - totalPrice} more</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
               <Ticket className="h-4 w-4" style={{ color: brandColor }} />
               <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Offers & Coupons</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed" style={{ backgroundColor: brandColor + '05', borderColor: brandColor + '30' }}>
                <span className="text-xs font-black uppercase" style={{ color: brandColor }}>{appliedCoupon.code} applied!</span>
                <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="h-7 text-[9px] font-black text-red-600">REMOVE</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input 
                  placeholder="ENTER PROMO CODE" 
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  className="h-10 text-xs font-black"
                />
                <Button onClick={() => handleApplyCoupon(couponInput)} className="text-white font-black text-[10px]" style={{ backgroundColor: brandColor }}>APPLY</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: brandColor }}>
              <Wallet className="h-4 w-4" /> Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-white">
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="space-y-3">
              <div className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                paymentMethod === 'Online' ? "border-current bg-opacity-5" : "border-gray-100 bg-gray-50/50"
              )} style={{ color: paymentMethod === 'Online' ? brandColor : undefined }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <Label htmlFor="online" className="text-sm font-black uppercase cursor-pointer">Online Payment</Label>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Cards, UPI, Netbanking</p>
                  </div>
                </div>
                <RadioGroupItem value="Online" id="online" className="border-2" />
              </div>

              <div className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                paymentMethod === 'Cash' ? "border-current bg-opacity-5" : "border-gray-100 bg-gray-50/50"
              )} style={{ color: paymentMethod === 'Cash' ? brandColor : undefined }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <RupeeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <Label htmlFor="cash" className="text-sm font-black uppercase cursor-pointer">Cash on Delivery</Label>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Pay at your doorstep</p>
                  </div>
                </div>
                <RadioGroupItem value="Cash" id="cash" className="border-2" />
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 bg-white">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <span>Item Total</span>
              <span>₹{calculations.subtotal}</span>
            </div>
            {calculations.discount > 0 && (
              <div className="flex justify-between text-xs font-black text-green-600 uppercase">
                <span>Coupon Discount</span>
                <span>-₹{calculations.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <span>Delivery Partner Fee</span>
              <span className={calculations.deliveryFee === 0 ? "text-green-600" : ""}>{calculations.deliveryFee === 0 ? "FREE" : `₹${calculations.deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase">
              <span>Taxes (GST @ {settings?.gstPercentage ?? 18}%)</span>
              <span>₹{calculations.gstTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed pt-3 flex justify-between items-center">
              <span className="text-lg font-black text-[#333333]">TO PAY</span>
              <span className="text-2xl font-black" style={{ color: brandColor }}>₹{Math.round(calculations.finalTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 rounded-xl flex items-center gap-3 shadow-lg" style={{ backgroundColor: brandColor }}>
           <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
           </div>
           <div>
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Loyalty Reward</p>
              <p className="text-xs font-black text-white uppercase italic">
                You will earn {Math.floor((calculations.subtotal / 100) * (settings?.loyaltyRatio ?? 1))} points
              </p>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        {!selectedAddress && (
          <div className="flex items-center gap-2 mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100 animate-pulse">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Please select a delivery address first</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-left">
            <ShieldCheck className="h-5 w-5" style={{ color: brandColor }} />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-[#333333]">Secure Terminal Entry</span>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {paymentMethod === 'Online' ? '100% Encrypted' : 'Verification Required'}
              </span>
            </div>
          </div>
        </div>
        <Button 
          onClick={handlePlaceOrder}
          disabled={isPlacing || !selectedAddress}
          className="w-full h-14 text-white text-lg font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
          style={{ backgroundColor: brandColor }}
        >
          {isPlacing ? <Loader2 className="animate-spin h-6 w-6" /> : (
            paymentMethod === 'Online' 
              ? `PROCEED TO PAY ₹${Math.round(calculations.finalTotal)}`
              : `CONFIRM CASH ORDER ₹${Math.round(calculations.finalTotal)}`
          )}
        </Button>
      </div>
    </div>
  );
}
