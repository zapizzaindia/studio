
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Plus, Minus, Trash2, Ticket, Loader2, Crown, ShieldCheck, MapPinned, AlertTriangle, IndianRupee as RupeeIcon, Navigation, CheckCircle2, ShoppingCart, Sparkles, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useUser, useDoc, useCollection, useFirestore } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, getDocs, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { GlobalSettings, Coupon, Address, Outlet, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createRazorpayOrder } from "./actions";
import { notifyAdminsOfOrder } from "@/app/actions/notifications";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Haversine formula to calculate distance in KM
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

  const checkIfOpen = useCallback((outlet: Outlet | null) => {
    if (!outlet) return false;
    if (!outlet.isOpen) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = (outlet.openingTime || "00:00").split(':').map(Number);
    const [closeH, closeM] = (outlet.closingTime || "23:59").split(':').map(Number);

    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    if (closeTime < openTime) {
      // Overnight operation (e.g., 18:00 to 04:00)
      return currentTime >= openTime || currentTime < closeTime;
    }

    return currentTime >= openTime && currentTime < closeTime;
  }, []);

  const isActuallyClosed = useMemo(() => !checkIfOpen(outlet), [outlet, checkIfOpen]);

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
    let eligibleItemsCount = 0;

    if (appliedCoupon) {
      // Logic for item/category restriction
      const eligibleItems = items.filter(item => {
        const isItemEligible = !appliedCoupon.eligibleItemIds || appliedCoupon.eligibleItemIds.includes(item.id);
        const isCategoryEligible = !appliedCoupon.eligibleCategoryIds || appliedCoupon.eligibleCategoryIds.includes(item.category);
        return isItemEligible && isCategoryEligible;
      });

      eligibleItemsCount = eligibleItems.reduce((sum, i) => sum + i.quantity, 0);
      const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

      if (appliedCoupon.type === 'bogo') {
        const sortedEligible = eligibleItems.flatMap(item => Array(item.quantity).fill(item.price)).sort((a, b) => a - b);
        const freeCount = Math.floor(sortedEligible.length / 2);
        discount = sortedEligible.slice(0, freeCount).reduce((sum, p) => sum + p, 0);

        if (sortedEligible.length > 0 && sortedEligible.length % 2 !== 0) {
            bogoNudge = `Add 1 more ${appliedCoupon.eligibleCategoryIds ? 'eligible item' : 'pizza'} to get it FREE!`;
        }
      } else {
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
        const maxRedeemable = (subtotal - discount) * 0.1; // Max 10% redemption
        loyaltyDiscount = Math.min(userProfile.loyaltyPoints, maxRedeemable);
    }

    const finalTotal = subtotal + gstTotal + deliveryFee - discount - loyaltyDiscount;
    const pointsEarned = Math.floor((subtotal / 100) * (settings?.loyaltyRatio ?? 1));

    return { 
      subtotal, 
      deliveryFee, 
      gstTotal, 
      cgst, 
      sgst, 
      gstRate, 
      discount, 
      loyaltyDiscount, 
      finalTotal, 
      distanceKm, 
      isOutOfRange, 
      bogoNudge,
      pointsEarned,
      eligibleItemsCount
    };
  }, [totalPrice, items, settings, appliedCoupon, selectedAddress, selectedOutlet, useLoyaltyPoints, userProfile]);

  const handleApplyCoupon = (couponOrCode: Coupon | string) => {
    if (!selectedOutlet) return;
    
    let found: Coupon | undefined;
    if (typeof couponOrCode === 'string') {
      found = allCoupons?.find(c => 
        c.code === couponInput.toUpperCase() && 
        c.brand === selectedOutlet.brand
      );
    } else {
      found = couponOrCode;
    }

    if (!found) {
      toast({ variant: 'destructive', title: "Invalid Code", description: `This coupon is not valid for ${selectedOutlet.brand.toUpperCase()}.` });
      return;
    }

    // Scheduling Validation
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const currentTimeStr = format(now, 'HH:mm');

    if (found.startDate && todayStr < found.startDate) {
      toast({ variant: 'destructive', title: "Coupon Not Active", description: `This offer starts on ${found.startDate}` });
      return;
    }
    if (found.endDate && todayStr > found.endDate) {
      toast({ variant: 'destructive', title: "Coupon Expired", description: "This offer is no longer valid." });
      return;
    }
    if (found.startTime && currentTimeStr < found.startTime) {
      toast({ variant: 'destructive', title: "Early for this Offer", description: `Valid daily from ${found.startTime}` });
      return;
    }
    if (found.endTime && currentTimeStr > found.endTime) {
      toast({ variant: 'destructive', title: "Offer Ended for Today", description: `Valid daily until ${found.endTime}` });
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

    const pointsEarned = calculations.pointsEarned;
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
      
      // Wake up outlet admins
      notifyAdminsOfOrder({
        orderId: orderRef.id,
        outletId: outletObj.id,
        customerName: customerName,
        total: orderData.total
      });

      // Update Loyalty Balance
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
    if (isActuallyClosed) {
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
        handler: async function (response: any) { 
          await saveOrderToFirestore(response.razorpay_payment_id, "Success"); 
        },
        prefill: { 
          name: userProfile?.displayName || user.displayName, 
          email: userProfile?.email || user.email, 
          contact: userProfile?.phoneNumber || user.phoneNumber 
        },
        theme: { color: selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d' },
        modal: { 
          ondismiss: function() { 
            setIsPlacing(false); 
            toast({ variant: 'destructive', title: "Payment Cancelled" }); 
          } 
        }
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
        <Button onClick={() => router.push('/home/menu')} className="bg-[#14532d] text-white px-8 h-12 font-black uppercase tracking-widest rounded-xl font-headline">GO TO MENU</Button>
      </div>
    );
  }

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';
  const brandCoupons = allCoupons?.filter(c => c.brand === selectedOutlet?.brand) || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-64 font-headline pt-[calc(56px+env(safe-area-inset-top))]">
      <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-30 bg-white border-b px-4 py-4 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-6 w-6" /></Button>
        <h1 className="text-xl font-black uppercase tracking-widest" style={{ color: brandColor }}>Review Order</h1>
      </div>

      <div className="container mx-auto p-4 space-y-6 max-w-lg text-left">
        {calculations.bogoNudge && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-[24px] flex items-center justify-between gap-3 animate-pulse shadow-sm">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <p className="text-[10px] font-black text-indigo-950 uppercase leading-tight">
                        {calculations.bogoNudge}
                    </p>
                </div>
                <Button onClick={() => router.push('/home/menu')} className="h-8 px-3 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase">ADD MORE</Button>
            </div>
        )}

        {isActuallyClosed && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-[24px] flex items-start gap-3 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-red-900 uppercase">Outlet is Currently Closed</p>
              <p className="text-[9px] font-bold text-red-700 leading-relaxed uppercase">HOURS: {outlet?.openingTime} - {outlet?.closingTime}</p>
            </div>
          </div>
        )}

        {/* Address Card */}
        <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 border-b py-4 flex flex-row items-center justify-between px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: brandColor }}>
              <MapPinned className="h-4 w-4" /> Delivery Destination
            </CardTitle>
            <Button variant="link" size="sm" onClick={() => router.push('/home/addresses')} className="h-auto p-0 text-[10px] font-black uppercase" style={{ color: brandColor }}>CHANGE</Button>
          </CardHeader>
          <CardContent className="p-6">
            {selectedAddress ? (
              <div className="flex justify-between items-start">
                <div>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase mb-2" style={{ backgroundColor: brandColor + '10', color: brandColor }}>{selectedAddress.label}</Badge>
                    <p className="text-sm font-bold text-[#333333] leading-snug">{selectedAddress.flatNo}, {selectedAddress.area}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{selectedAddress.city}</p>
                </div>
                {selectedAddress.latitude && (
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1 mb-1"><Navigation className="h-2 w-2 fill-current" /> GPS PINNED</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase font-sans tabular-nums">{calculations.distanceKm.toFixed(1)} KM</span>
                    </div>
                )}
              </div>
            ) : (
              <Button onClick={() => router.push('/home/addresses')} variant="outline" className="w-full border-dashed rounded-xl font-black uppercase text-xs h-14" style={{ borderColor: brandColor, color: brandColor }}>+ Add Delivery Address</Button>
            )}
          </CardContent>
        </Card>

        {/* Item Summary Card */}
        <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.map((item) => {
              const isEligibleForBogo = appliedCoupon?.type === 'bogo' && (
                (!appliedCoupon.eligibleItemIds || appliedCoupon.eligibleItemIds.includes(item.id)) &&
                (!appliedCoupon.eligibleCategoryIds || appliedCoupon.eligibleCategoryIds.includes(item.category))
              );
              const showItemBogoNudge = isEligibleForBogo && (calculations.eligibleItemsCount % 2 !== 0);

              return (
                <div key={item.cartId} className="p-6 border-b last:border-0 flex flex-col hover:bg-gray-50/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-3.5 w-3.5 border-2 flex items-center justify-center rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'border-red-600'}`} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-black text-[#333333] uppercase leading-tight">{item.name}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.selectedVariation && <Badge variant="outline" className="text-[7px] font-black uppercase h-4 px-2 border-gray-200 bg-white">Size: {item.selectedVariation.name}</Badge>}
                            {item.selectedAddons?.map(a => <Badge key={a.name} variant="outline" className="text-[7px] font-black uppercase h-4 px-2 border-dashed text-muted-foreground bg-white">+ {a.name}</Badge>)}
                        </div>
                        <span className="text-[12px] font-black mt-2 block font-sans tabular-nums" style={{ color: brandColor }}>₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-[#f1f2f6] rounded-xl px-3 py-1.5 shadow-inner">
                        <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-red-600 transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="text-sm font-black min-w-[20px] text-center font-sans tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-green-600 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => removeItem(item.cartId)}><Trash2 className="h-4.5 w-4.5" /></Button>
                    </div>
                  </div>
                  
                  {showItemBogoNudge && (
                    <div className="mt-4 bg-indigo-50/50 border border-dashed border-indigo-200 p-2.5 rounded-xl flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-indigo-600" />
                      <p className="text-[9px] font-black uppercase text-indigo-900 tracking-tight">
                        Add 1 more item to avail Buy 1 Get 1 offer!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Special Instructions Card */}
        <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kitchen Instructions</span>
            </div>
            <Textarea 
                placeholder="e.g. Please avoid onions / Leave at the gate" 
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value)}
                className="h-24 rounded-2xl font-medium text-sm border-gray-100 bg-gray-50/50 p-4 focus:ring-primary/20"
            />
          </CardContent>
        </Card>

        {/* Coupon Card */}
        <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="h-4 w-4" style={{ color: brandColor }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Promos & Coupons</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed" style={{ backgroundColor: brandColor + '05', borderColor: brandColor + '30' }}>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black uppercase italic tracking-tight" style={{ color: brandColor }}>{appliedCoupon.code} APPLIED!</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="h-8 text-[9px] font-black text-red-600 hover:bg-red-50 rounded-xl">REMOVE</Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex gap-2">
                  <Input 
                    placeholder="ENTER VOUCHER CODE" 
                    value={couponInput} 
                    onChange={e => setCouponInput(e.target.value)} 
                    className="h-12 text-xs font-black uppercase rounded-xl border-gray-100 bg-gray-50/50 tracking-widest px-4" 
                  />
                  <Button onClick={() => handleApplyCoupon(couponInput)} className="text-white font-black text-[10px] h-12 px-8 rounded-xl shadow-lg border-none active:scale-95" style={{ backgroundColor: brandColor }}>APPLY</Button>
                </div>
                {brandCoupons.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {brandCoupons.map((coupon) => (
                      <button key={coupon.id} onClick={() => handleApplyCoupon(coupon)} className="flex-shrink-0 text-left p-3.5 rounded-2xl border-2 border-dashed bg-gray-50 hover:bg-white transition-all active:scale-[0.98] group" style={{ borderColor: brandColor + '20' }}>
                        <span className="text-[11px] font-black text-[#333] uppercase tracking-tight group-hover:text-primary">{coupon.code}</span>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{coupon.type === 'bogo' ? 'BUY 1 GET 1' : `${coupon.discountValue}% OFF`}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Points Card */}
        {userProfile?.loyaltyPoints ? (
            <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
                            <Crown className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Redeem LP Coins</span>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Available: {userProfile.loyaltyPoints} Coins</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {useLoyaltyPoints && <span className="text-[11px] font-black uppercase text-green-600 animate-pulse">-₹{calculations.loyaltyDiscount.toFixed(0)}</span>}
                        <Switch 
                            checked={useLoyaltyPoints} 
                            onCheckedChange={setUseLoyaltyPoints} 
                            className="data-[state=checked]:bg-amber-500 scale-110"
                        />
                    </div>
                </CardContent>
            </Card>
        ) : null}

        {/* Enhanced Bill Details Card */}
        <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-tight">
                <span>Item Total</span>
                <span className="font-sans tabular-nums text-[#333]">₹{calculations.subtotal.toFixed(2)}</span>
            </div>
            
            {calculations.discount > 0 && (
                <div className="flex justify-between text-xs font-black text-green-600 uppercase tracking-tight">
                    <span>Promo Discount</span>
                    <span className="font-sans tabular-nums">-₹{calculations.discount.toFixed(2)}</span>
                </div>
            )}

            {calculations.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-xs font-black text-amber-600 uppercase tracking-tight">
                    <span>LP Coins Redeemed</span>
                    <span className="font-sans tabular-nums">-₹{calculations.loyaltyDiscount.toFixed(2)}</span>
                </div>
            )}

            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-tight">
                <span>Delivery Logistics</span>
                <span className={cn("font-sans tabular-nums", calculations.deliveryFee === 0 ? "text-green-600 font-black" : "text-[#333]")}>
                    {calculations.deliveryFee === 0 ? "FREE" : `₹${calculations.deliveryFee.toFixed(2)}`}
                </span>
            </div>

            <div className="pt-2 space-y-1.5 border-t border-gray-50">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                    <span>CGST ({(calculations.gstRate / 2).toFixed(1)}%)</span>
                    <span className="font-sans tabular-nums">₹{calculations.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                    <span>SGST ({(calculations.gstRate / 2).toFixed(1)}%)</span>
                    <span className="font-sans tabular-nums">₹{calculations.sgst.toFixed(2)}</span>
                </div>
            </div>

            <div className="border-t border-dashed pt-5 flex justify-between items-center">
                <div className="flex flex-col text-left">
                    <span className="text-xl font-black text-[#333333] uppercase italic leading-none tracking-tighter">GRAND TOTAL</span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Inclusive of all taxes</span>
                </div>
                <span className="text-3xl font-black font-sans tabular-nums tracking-tighter" style={{ color: brandColor }}>₹{Math.round(calculations.finalTotal)}</span>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between bg-amber-50/30 -mx-6 px-6 -mb-6 pb-6">
                <span className="text-[9px] font-black text-[#333] uppercase tracking-widest">Rewards to Earn</span>
                <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500 fill-current" />
                    <span className="text-sm font-black text-amber-600 font-sans tabular-nums">+{calculations.pointsEarned} LP Coins</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Gateway Security Badge */}
        <div className="flex items-center justify-center gap-2 py-6 opacity-40">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">100% Secure PCI-DSS Gateway</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.12)]">
        <Button 
            onClick={handlePlaceOrder} 
            disabled={isPlacing || !selectedAddress || calculations.isOutOfRange || isActuallyClosed} 
            className="w-full h-16 text-white text-lg font-black uppercase tracking-[0.1em] rounded-2xl shadow-xl transition-all active:scale-95 border-none" 
            style={{ backgroundColor: brandColor }}
        >
          {isPlacing ? <Loader2 className="animate-spin h-6 w-6" /> : (isActuallyClosed ? "OUTLET CLOSED" : (calculations.isOutOfRange ? "OUT OF RANGE" : `PAY ₹${Math.round(calculations.finalTotal)}`))}
        </Button>
      </div>
    </div>
  );
}
