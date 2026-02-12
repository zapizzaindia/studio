
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CreditCard, ChevronRight, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useUser, useFirestore } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const [isPlacing, setIsPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Please login to place order", variant: "destructive" });
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
      total: totalPrice,
      status: "New",
      createdAt: serverTimestamp(),
      outletId: outlet.id
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      router.push('/home/checkout/success');
    } catch (e: any) {
      toast({ title: "Failed to place order", description: e.message, variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <div className="bg-[#f1f2f6] p-8 rounded-full mb-6">
          <Trash2 className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-black text-[#14532d] uppercase italic mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Add some delicious pizzas to start your feast!</p>
        <Button onClick={() => router.push('/home/menu')} className="bg-[#14532d] text-white px-8 h-12 font-black uppercase tracking-widest rounded-xl">
          GO TO MENU
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black text-[#14532d] uppercase tracking-widest">Checkout</h1>
      </div>

      <div className="container mx-auto p-4 space-y-4">
        {/* Items Section */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-sm font-black text-[#14532d] uppercase tracking-widest">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {items.map((item) => (
              <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 border flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-[#333333] uppercase leading-tight">{item.name}</h4>
                    <span className="text-[12px] font-black text-[#14532d] mt-1 block">₹{item.price * item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#f1f2f6] rounded-lg px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary transition-colors">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-black min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery Section */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#14532d]/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-[#14532d]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Delivering to</p>
                <p className="text-sm font-black text-[#333333]">Current Location <ChevronRight className="inline h-3 w-3" /></p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px]">CHANGE</Button>
          </CardContent>
        </Card>

        {/* Bill Details */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-sm font-black text-[#14532d] uppercase tracking-widest">Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 bg-white">
            <div className="flex justify-between text-sm text-muted-foreground font-medium">
              <span>Item Total</span>
              <span>₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground font-medium">
              <span>Delivery Partner Fee</span>
              <span>₹30</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground font-medium">
              <span>Taxes and Charges</span>
              <span>₹18</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-black text-[#333333]">
              <span>GRAND TOTAL</span>
              <span>₹{totalPrice + 48}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#14532d]" />
            <span className="text-[12px] font-black uppercase text-[#333333]">Cash on Delivery</span>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-black text-[10px] uppercase">CHANGE</Button>
        </div>
        <Button 
          onClick={handlePlaceOrder}
          disabled={isPlacing}
          className="w-full h-14 bg-[#e31837] hover:bg-[#c61430] text-white text-lg font-black uppercase tracking-widest rounded-xl shadow-lg"
        >
          {isPlacing ? "PLACING ORDER..." : `PLACE ORDER - ₹${totalPrice + 48}`}
        </Button>
      </div>
    </div>
  );
}
