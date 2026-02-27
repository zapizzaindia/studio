
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Plus, Minus, Trash2, Ticket, Loader2, Crown, ShieldCheck, MapPinned, AlertTriangle, MessageSquareText, Wallet, IndianRupee as RupeeIcon, Navigation } from "lucide-react";
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
import { createRazorpayOrder } from "./actions";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Haversine formula to calculate distance in KM
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
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

  const calculations = useMemo(() => {
    const subtotal = totalPrice;
    const gstRate = settings?.gstPercentage ?? 18;
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

        if (distanceKm > maxRadius) {
            isOutOfRange = true;
        }

        // Apply distance slabs if configured
        if (settings?.distanceSlabs && settings.distanceSlabs.length > 0) {
            const matchedSlab = settings.distanceSlabs.find(s => distanceKm <= s.upToKm);
            if (matchedSlab) {
                computedDeliveryFee = matchedSlab.fee;
            } else if (!isOutOfRange) {
                // If no slab matches but it's within max radius, use the highest slab or base fee
                computedDeliveryFee = settings.distanceSlabs[settings.distanceSlabs.length - 1].fee;
            }
        }
    }

    const deliveryFee = subtotal >= freeThreshold ? 0 : computedDeliveryFee;
    const gstTotal = (subtotal * gstRate) / 100;
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        const potentialDiscount = (subtotal * appliedCoupon.discountValue) / 100;
        discount = appliedCoupon.maxDiscountAmount 
            ? Math.min(potentialDiscount, appliedCoupon.maxDiscountAmount) 
            : potentialDiscount;
      } else {
        discount = appliedCoupon.discountValue;
      }
    }

    const finalTotal = subtotal + gstTotal + deliveryFee - discount;

    return { subtotal, deliveryFee, gstTotal, discount, finalTotal, distanceKm, isOutOfRange };
  }, [totalPrice, settings, appliedCoupon, selectedAddress, selectedOutlet]);

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
    toast({ title: "Coupon Applied!" });
  };

  const saveOrderToFirestore = async (paymentId: string, status: string = "Success") => {
    if (!db || !user) return;

    const pointsEarned = Math.floor((calculations.subtotal / 100) * (settings?.loyaltyRatio ?? 1));
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
      distanceKm: calculations.distanceKm,
      status: "New",
      createdAt: serverTimestamp(),
      outletId: outlet.id,
      deliveryAddress: {
        label: selectedAddress?.label || "Home",
        flatNo: selectedAddress?.flatNo || "N/A",
        area: selectedAddress?.area || "N/A",
        landmark: selectedAddress?.landmark || null,
        city: selectedAddress?.city || "N/A",
        latitude: selectedAddress?.latitude || null,
        longitude: selectedAddress?.longitude || null
      },
      paymentMethod: paymentMethod,
      paymentStatus: status,
      paymentId: paymentId,
      loyaltyPointsEarned: pointsEarned,
      specialNote: specialNote.trim() || null
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      if (pointsEarned > 0) {
        await updateDoc(doc(db, 'users', user.uid), { loyaltyPoints: increment(pointsEarned) });
      }
      clearCart();
      router.push('/home/checkout/success');
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'orders',
        operation: 'create',
        requestResourceData: orderData,
      }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) { router.push('/login'); return; }
    if (!selectedAddress) {
      toast({ variant: 'destructive', title: "Address Required", description: "Where should we deliver?" });
      return;
    }
    if (calculations.isOutOfRange) {
        toast({ variant: 'destructive', title: "Out of Range", description: "This address is beyond our delivery zone." });
        return;
    }

    setIsPlacing(true);

    if (paymentMethod === 'Cash') {
      toast({ title: "Submitting Order...", description: "Confirming your COD request..." });
      await saveOrderToFirestore(`cod_${Math.random().toString(36).substring(7)}`, "Pending");
      setIsPlacing(false);
      return;
    }

    // ONLINE PAYMENT FLOW
    try {
      toast({ title: "Initiating Gateway", description: "Connecting to secure servers..." });
      const order = await createRazorpayOrder(calculations.finalTotal);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock_key",
        amount: order.amount,
        currency: order.currency,
        name: selectedOutlet?.brand === 'zfry' ? "Zfry India" : "Zapizza",
        description: `Order Payment #${order.id.slice(-6)}`,
        order_id: order.id,
        handler: async function (response: any) {
          toast({ title: "Payment Verified", description: "Finalizing your feast..." });
          await saveOrderToFirestore(response.razorpay_payment_id, "Success");
        },
        prefill: {
          name: userProfile?.displayName || user.displayName,
          email: userProfile?.email || user.email,
          contact: userProfile?.phoneNumber || user.phoneNumber,
        },
        theme: {
          color: selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d',
        },
        modal: {
          ondismiss: function() {
            setIsPlacing(false);
            toast({ variant: 'destructive', title: "Payment Cancelled", description: "Transaction was not completed." });
          }
        }
      };

      if (typeof window.Razorpay === 'undefined') {
        throw new Error("Razorpay SDK failed to load. Please check your connection.");
      }

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
        <Trash2 className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-black text-[#14532d] uppercase italic mb-2 font-headline">Your cart is empty</h2>
        <Button onClick={() => router.push('/home/menu')} className="bg-[#14532d] text-white px-8 h-12 font-black uppercase tracking-widest rounded-xl font-headline">GO TO MENU</Button>
      </div>
    );
  }

  const brandColor = selectedOutlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-48">
      <Script 
        id="razorpay-checkout" 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => console.log("Razorpay SDK Loaded")}
      />

      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black uppercase tracking-widest font-headline" style={{ color: brandColor }}>Review Order</h1>
      </div>

      <div className="container mx-auto p-4 space-y-4 max-w-lg text-left">
        {calculations.isOutOfRange && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-red-900 uppercase">Out of Delivery Range</p>
                    <p className="text-[9px] font-bold text-red-700 leading-relaxed uppercase mt-1">
                        We currently only deliver up to {settings?.maxDeliveryRadius || 10}km. This address is {calculations.distanceKm.toFixed(1)}km away.
                    </p>
                </div>
            </div>
        )}

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-headline" style={{ color: brandColor }}>
              <MapPinned className="h-4 w-4" /> Delivery Address
            </CardTitle>
            <Button variant="link" size="sm" onClick={() => router.push('/home/addresses')} className="h-auto p-0 text-[10px] font-black uppercase font-headline" style={{ color: brandColor }}>CHANGE</Button>
          </CardHeader>
          <CardContent className="p-4 bg-white">
            {selectedAddress ? (
              <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2 font-headline">
                    <Badge variant="secondary" className="text-[8px] font-black uppercase" style={{ backgroundColor: brandColor + '10', color: brandColor }}>{selectedAddress.label}</Badge>
                    </div>
                    <p className="text-xs font-bold text-[#333333] leading-snug font-body">{selectedAddress.flatNo}, {selectedAddress.area}</p>
                    {selectedAddress.landmark && <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1 font-headline">Near: {selectedAddress.landmark}</p>}
                </div>
                {selectedAddress.latitude && (
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1 mb-1">
                            <Navigation className="h-2 w-2 fill-current" /> GPS PINNED
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase font-roboto tabular-nums">{calculations.distanceKm.toFixed(1)} KM</span>
                    </div>
                )}
              </div>
            ) : (
              <Button onClick={() => router.push('/home/addresses')} variant="outline" className="w-full border-dashed font-black uppercase text-xs h-12 font-headline" style={{ borderColor: brandColor, color: brandColor }}>
                + Add Delivery Address
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest font-headline" style={{ color: brandColor }}>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {items.map((item) => (
              <div key={item.cartId} className="p-4 border-b last:border-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 border flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-[#333333] uppercase leading-tight font-headline">{item.name}</h4>
                    <span className="text-[11px] font-black mt-1.5 block font-roboto tabular-nums" style={{ color: brandColor }}>₹{item.price * item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-[#f1f2f6] rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-black min-w-[20px] text-center font-roboto tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 bg-white font-headline">
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
                  className="h-10 text-xs font-black uppercase"
                />
                <Button onClick={() => handleApplyCoupon(couponInput)} className="text-white font-black text-[10px]" style={{ backgroundColor: brandColor }}>APPLY</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden font-headline">
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
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-muted-foreground">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <Label htmlFor="online" className="text-sm font-black uppercase cursor-pointer">Pay Online</Label>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Cards, UPI, Wallets</p>
                  </div>
                </div>
                <RadioGroupItem value="Online" id="online" className="border-2" />
              </div>

              <div className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                paymentMethod === 'Cash' ? "border-current bg-opacity-5" : "border-gray-100 bg-gray-50/50"
              )} style={{ color: paymentMethod === 'Cash' ? brandColor : undefined }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-muted-foreground">
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
            <CardTitle className="text-[10px] font-black uppercase tracking-widest font-headline" style={{ color: brandColor }}>Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 bg-white font-headline">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <span>Item Total</span>
              <span className="font-roboto tabular-nums">₹{calculations.subtotal}</span>
            </div>
            {calculations.discount > 0 && (
              <div className="flex justify-between text-xs font-black text-green-600 uppercase">
                <span>Coupon Discount</span>
                <span className="font-roboto tabular-nums">-₹{calculations.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <div className="flex flex-col">
                <span>Delivery Fee</span>
                {selectedAddress?.latitude && (
                    <span className="text-[7px] text-muted-foreground/60 leading-none mt-0.5">Based on {calculations.distanceKm.toFixed(1)}km distance</span>
                )}
              </div>
              <span className={cn("font-roboto tabular-nums", calculations.deliveryFee === 0 ? "text-green-600" : "")}>
                {calculations.deliveryFee === 0 ? "FREE" : `₹${calculations.deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60 uppercase">
              <span>GST ({settings?.gstPercentage ?? 18}%)</span>
              <span className="font-roboto tabular-nums">₹{calculations.gstTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed pt-3 flex justify-between items-center">
              <span className="text-lg font-black text-[#333333]">TO PAY</span>
              <span className="text-2xl font-black font-roboto tabular-nums" style={{ color: brandColor }}>₹{Math.round(calculations.finalTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] font-headline">
        <Button 
          onClick={handlePlaceOrder}
          disabled={isPlacing || !selectedAddress || calculations.isOutOfRange}
          className="w-full h-14 text-white text-lg font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
          style={{ backgroundColor: brandColor }}
        >
          {isPlacing ? <Loader2 className="animate-spin h-6 w-6" /> : (
            calculations.isOutOfRange ? "UNAVAILABLE IN YOUR AREA" : (
                paymentMethod === 'Online' 
                ? `PAY ₹${Math.round(calculations.finalTotal)}`
                : `CONFIRM ORDER ₹${Math.round(calculations.finalTotal)}`
            )
          )}
        </Button>
      </div>
    </div>
  );
}
