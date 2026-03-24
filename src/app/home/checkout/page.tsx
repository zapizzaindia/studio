
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Plus, Minus, Trash2, Ticket, Loader2, Crown, ShieldCheck, MapPinned, AlertTriangle, IndianRupee as RupeeIcon, Navigation, CheckCircle2, ShoppingCart, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { createRazorpayOrder } from "./actions";
import { notifyAdminsOfOrder } from "@/app/actions/notifications";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, totalPrice, updateQuantity, clearCart, removeItem } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  
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
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  useEffect(() => {
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    if (savedOutlet) {
      try { setSelectedOutlet(JSON.parse(savedOutlet)); } catch(e) {}
    }
  }, []);

  const { data: realTimeOutlet } = useDoc<Outlet>('outlets', selectedOutlet?.id || 'dummy');
  const outlet = realTimeOutlet || selectedOutlet;
  const isOutletClosed = outlet?.isOpen === false;

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

  const calculations = useMemo(() => {
    const subtotal = totalPrice;
    const gstRate = settings?.gstPercentage ?? 5; 
    const freeThreshold = settings?.minOrderForFreeDelivery ?? 500;
    const maxRadius = settings?.maxDeliveryRadius ?? 10;
    
    let distanceKm = 0;
    let computedDeliveryFee = settings?.deliveryFee ?? 40;
    let isOutOfRange = false;

    if (selectedAddress?.latitude && selectedOutlet?.latitude) {
        distanceKm = getDistance(
            selectedOutlet.latitude, 
            selectedOutlet.longitude!, 
            selectedAddress.latitude, 
            selectedAddress.longitude!
        );
        if (distanceKm > maxRadius) isOutOfRange = true;
        if (settings?.distanceSlabs && settings.distanceSlabs.length > 0) {
            const matchedSlab = settings.distanceSlabs.find(s => distanceKm <= s.upToKm);
            if (matchedSlab) computedDeliveryFee = matchedSlab.fee;
            else if (!isOutOfRange) computedDeliveryFee = settings.distanceSlabs[settings.distanceSlabs.length - 1].fee;
        }
    }

    const deliveryFee = subtotal >= freeThreshold ? 0 : computedDeliveryFee;
    
    let discount = 0;
    let bogoNudge: string | null = null;

    if (appliedCoupon) {
      // Logic for item/category restriction
      const eligibleItems = items.filter(item => {
        const isItemEligible = !appliedCoupon.eligibleItemIds || appliedCoupon.eligibleItemIds.includes(item.id);
        const isCategoryEligible = !appliedCoupon.eligibleCategoryIds || appliedCoupon.eligibleCategoryIds.includes(item.category);
        return isItemEligible && isCategoryEligible;
      });

      const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

      if (appliedCoupon.type === 'bogo') {
        // Buy 1 Get 1 logic: Buy X items, floor(X/2) cheapest ones are free
        const sortedEligible = eligibleItems.flatMap(item => Array(item.quantity).fill(item.price)).sort((a, b) => a - b);
        const freeCount = Math.floor(sortedEligible.length / 2);
        
        // Take the smallest freeCount prices and sum them
        discount = sortedEligible.slice(0, freeCount).reduce((sum, p) => sum + p, 0);

        // Nudge logic: If user has 1, 3, 5 items... they are 1 away from another free item
        if (sortedEligible.length > 0 && sortedEligible.length % 2 !== 0) {
            bogoNudge = "Add 1 more item from this offer category to get it FREE!";
        }
      } else {
        // Standard Targeting
        if (appliedCoupon.discountType === 'percentage') {
          const potentialDiscount = (eligibleSubtotal * appliedCoupon.discountValue) / 100;
          discount = appliedCoupon.maxDiscountAmount 
              ? Math.min(potentialDiscount, appliedCoupon.maxDiscountAmount) 
              : potentialDiscount;
        } else {
          discount = appliedCoupon.discountValue;
        }
      }
    }

    const gstTotal = ((subtotal - discount) * gstRate) / 100;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    let loyaltyDiscount = 0;
    if (useLoyaltyPoints && userProfile?.loyaltyPoints) {
        const maxRedeemable = (subtotal - discount) * 0.1;
        loyaltyDiscount = Math.min(userProfile.loyaltyPoints, maxRedeemable);
    }

    const finalTotal = subtotal + gstTotal + deliveryFee - discount - loyaltyDiscount;

    return { subtotal, deliveryFee, gstTotal, cgst, sgst, gstRate, discount, loyaltyDiscount, finalTotal, distanceKm, isOutOfRange, bogoNudge };
  }, [totalPrice, items, settings, appliedCoupon, selectedAddress, selectedOutlet, useLoyaltyPoints, userProfile]);

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
      toast({ variant: 'destructive', title: "Invalid Code", description: `This coupon is not valid for ${selectedOutlet.brand.toUpperCase()}.` });
      return;
    }
    if (totalPrice < found.minOrderAmount) {
      toast({ variant: 'destructive', title: "Below Min Order", description: `Add ₹${found.minOrderAmount - totalPrice} more to use this.` });
      return;
    }
    
    setAppliedCoupon(found);
    setCouponInput("");
    toast({ title: "Coupon Applied!" });
  };

  const saveOrderToFirestore = async (paymentId: string, status: string = "Success") => {
    if (!db || !user) return;

    const pointsEarned = Math.floor((calculations.subtotal / 100) * (settings?.loyaltyRatio ?? 1));
    const outletObj = selectedOutlet || { id: 'default' };
    const customerName = userProfile?.displayName || user.displayName || "Gourmet Customer";

    const orderData: any = {
      customerId: user.uid,
      customerName: customerName,
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
      cgst: calculations.cgst,
      sgst: calculations.sgst,
      gstRate: calculations.gstRate,
      deliveryFee: calculations.deliveryFee,
      discount: calculations.discount,
      loyaltyPointsRedeemed: calculations.loyaltyDiscount,
      total: Math.round(calculations.finalTotal),
      distanceKm: calculations.distanceKm,
      status: "New",
      createdAt: serverTimestamp(),
      outletId: outletObj.id,
      deliveryAddress: {
        label: selectedAddress?.label || "Home",
        flatNo: selectedAddress?.flatNo || "N/A",
        area: selectedAddress?.area || "N/A",
        landmark: selectedAddress?.landmark || null,
        city: selectedAddress?.city || "N/A",
        latitude: selectedAddress?.latitude || null,
        longitude: selectedAddress?.longitude || null
      },
      paymentMethod: "Online",
      paymentStatus: status,
      paymentId: paymentId,
      loyaltyPointsEarned: pointsEarned,
      specialNote: specialNote.trim() || null
    };

    try {
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      notifyAdminsOfOrder({
        orderId: orderRef.id,
        outletId: outletObj.id,
        customerName: customerName,
        total: orderData.total
      });
      const netPointsUpdate = pointsEarned - (calculations.loyaltyDiscount || 0);
      if (netPointsUpdate !== 0) {
        await updateDoc(doc(db, 'users', user.uid), { loyaltyPoints: increment(netPointsUpdate) });
      }
      clearCart();
      router.push('/home/checkout/success');
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'orders', operation: 'create', requestResourceData: orderData }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) { router.push('/login'); return; }
    if (isOutletClosed) {
      toast({ variant: 'destructive', title: "Outlet Closed", description: "This kitchen is currently not accepting orders." });
      return;
    }
    if (!selectedAddress) {
      toast({ variant: 'destructive', title: "Address Required", description: "Where should we deliver?" });
      return;
    }
    if (calculations.isOutOfRange) {
        toast({ variant: 'destructive', title: "Out of Range", description: "This address is beyond our delivery zone." });
        return;
    }

    setIsPlacing(true);
    try {
      const order = await createRazorpayOrder(calculations.finalTotal);
      const options = {
        key: "rzp_live_SPtyccI9oY5o0h",
        amount: order.amount,
        currency: order.currency,
        name: selectedOutlet?.brand === 'zfry' ? "Zfry India" : "Zapizza",
        description: `Order Payment #${order.id.slice(-6)}`,
        order_id: order.id,
        handler: async function (response: any) { await saveOrderToFirestore(response.razorpay_payment_id, "Success"); },
        prefill: { name: userProfile?.displayName || user.displayName, email: userProfile?.email || user.email, contact: userProfile?.phoneNumber || user.phoneNumber },
        theme: { color: selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d' },
        modal: { ondismiss: function() { setIsPlacing(false); toast({ variant: 'destructive', title: "Payment Cancelled" }); } }
      };
      if (typeof window.Razorpay === 'undefined') throw new Error("Gateway SDK failed to load.");
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Gateway Error", description: e.message });
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-black text-[#14532d] uppercase italic mb-2 font-headline">Your cart is empty</h2>
        <Button onClick={() => router.push('/home/menu')} className="bg-[#14532d] text-white px-8 h-12 font-black uppercase tracking-widest rounded-xl">GO TO MENU</Button>
      </div>
    );
  }

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';
  const brandCoupons = allCoupons?.filter(c => c.brand === selectedOutlet?.brand) || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-64">
      <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4 pt-safe">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-6 w-6" /></Button>
        <h1 className="text-xl font-black uppercase tracking-widest font-headline" style={{ color: brandColor }}>Review Order</h1>
      </div>

      <div className="container mx-auto p-4 space-y-4 max-w-lg text-left">
        {calculations.bogoNudge && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <p className="text-[10px] font-black text-indigo-950 uppercase leading-tight font-headline">
                        {calculations.bogoNudge}
                    </p>
                </div>
                <Button onClick={() => router.push('/home/menu')} className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase">ADD MORE</Button>
            </div>
        )}

        {isOutletClosed && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-[9px] font-bold text-red-700 leading-relaxed uppercase mt-1 font-headline">This kitchen is currently closed.</p>
          </div>
        )}

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between font-headline">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: brandColor }}>
              <MapPinned className="h-4 w-4" /> Delivery Address
            </CardTitle>
            <Button variant="link" size="sm" onClick={() => router.push('/home/addresses')} className="h-auto p-0 text-[10px] font-black uppercase" style={{ color: brandColor }}>CHANGE</Button>
          </CardHeader>
          <CardContent className="p-4 bg-white font-headline">
            {selectedAddress ? (
              <div className="flex justify-between items-start">
                <div>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase mb-2" style={{ backgroundColor: brandColor + '10', color: brandColor }}>{selectedAddress.label}</Badge>
                    <p className="text-xs font-bold text-[#333333] leading-snug">{selectedAddress.flatNo}, {selectedAddress.area}</p>
                </div>
                {selectedAddress.latitude && (
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1 mb-1 font-headline"><Navigation className="h-2 w-2 fill-current" /> GPS PINNED</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase font-sans tabular-nums">{calculations.distanceKm.toFixed(1)} KM</span>
                    </div>
                )}
              </div>
            ) : (
              <Button onClick={() => router.push('/home/addresses')} variant="outline" className="w-full border-dashed font-black uppercase text-xs h-12" style={{ borderColor: brandColor, color: brandColor }}>+ Add Address</Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm font-headline">
          <CardHeader className="bg-white border-b py-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Order Summary</CardTitle></CardHeader>
          <CardContent className="p-0 bg-white">
            {items.map((item) => (
              <div key={item.cartId} className="p-4 border-b last:border-0 flex items-center justify-between font-headline">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 border flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-[#333333] uppercase leading-tight">{item.name}</h4>
                    <span className="text-[11px] font-black mt-1.5 block font-sans tabular-nums" style={{ color: brandColor }}>₹{item.price * item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-[#f1f2f6] rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.cartId, -1)}><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-black min-w-[20px] text-center font-sans tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(item.cartId)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden font-headline">
          <CardContent className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-3"><Ticket className="h-4 w-4" style={{ color: brandColor }} /><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Offers & Coupons</span></div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed" style={{ backgroundColor: brandColor + '05', borderColor: brandColor + '30' }}>
                <span className="text-xs font-black uppercase" style={{ color: brandColor }}>{appliedCoupon.code} applied!</span>
                <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="h-7 text-[9px] font-black text-red-600">REMOVE</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="ENTER CODE" value={couponInput} onChange={e => setCouponInput(e.target.value)} className="h-10 text-xs font-black uppercase" />
                  <Button onClick={() => handleApplyCoupon(couponInput)} className="text-white font-black text-[10px]" style={{ backgroundColor: brandColor }}>APPLY</Button>
                </div>
                {brandCoupons.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {brandCoupons.map((coupon) => (
                      <button key={coupon.id} onClick={() => handleApplyCoupon(coupon)} className="flex-shrink-0 text-left p-2.5 rounded-xl border border-dashed bg-gray-50 hover:bg-white" style={{ borderColor: brandColor + '30' }}>
                        <span className="text-[10px] font-black text-[#333] uppercase">{coupon.code}</span>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{coupon.type === 'bogo' ? 'BUY 1 GET 1' : `${coupon.discountValue}% OFF`}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm font-headline">
          <CardHeader className="bg-white border-b py-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Bill Details</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3 bg-white font-headline">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase"><span>Item Total</span><span className="font-sans tabular-nums">₹{calculations.subtotal}</span></div>
            {calculations.discount > 0 && <div className="flex justify-between text-xs font-black text-green-600 uppercase"><span>Coupon Discount</span><span className="font-sans tabular-nums">-₹{calculations.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase"><span>Delivery Fee</span><span className={cn("font-sans tabular-nums", calculations.deliveryFee === 0 ? "text-green-600" : "")}>{calculations.deliveryFee === 0 ? "FREE" : `₹${calculations.deliveryFee}`}</span></div>
            <div className="border-t border-dashed pt-3 flex justify-between items-center"><span className="text-lg font-black text-[#333333]">TO PAY</span><span className="text-2xl font-black font-sans tabular-nums" style={{ color: brandColor }}>₹{Math.round(calculations.finalTotal)}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] font-headline">
        <Button onClick={handlePlaceOrder} disabled={isPlacing || !selectedAddress || calculations.isOutOfRange || isOutletClosed} className="w-full h-14 text-white text-lg font-black uppercase tracking-widest rounded-xl shadow-lg" style={{ backgroundColor: brandColor }}>
          {isPlacing ? <Loader2 className="animate-spin h-6 w-6" /> : (isOutletClosed ? "OUTLET CLOSED" : (calculations.isOutOfRange ? "OUT OF RANGE" : `PAY ₹${Math.round(calculations.finalTotal)}`))}
        </Button>
      </div>
    </div>
  );
}
