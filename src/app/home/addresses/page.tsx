
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, Map, Check, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore } from "@/firebase";
import { collection, doc, addDoc, deleteDoc, updateDoc, query, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Address } from "@/lib/types";

const labelIcons = {
  Home: <Home className="h-4 w-4" />,
  Work: <Briefcase className="h-4 w-4" />,
  Other: <Map className="h-4 w-4" />,
};

export default function AddressesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Form State
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flatNo, setFlatNo] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  useEffect(() => {
    if (!user || !db) return;
    
    const fetchAddresses = async () => {
      try {
        const q = query(collection(db, `users/${user.uid}/addresses`));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
        setAddresses(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user, db]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsDetecting(false);
        toast({ title: "Location captured!", description: "We've pinned your exact coordinates." });
      },
      (error) => {
        setIsDetecting(false);
        toast({ title: "Permission Denied", description: "Please allow location access to use this feature.", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddAddress = async () => {
    if (!user || !db) return;
    if (!flatNo || !area || !city) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    const newAddress = {
      label,
      flatNo,
      area,
      landmark,
      city,
      isDefault: addresses.length === 0,
      latitude: coords.lat,
      longitude: coords.lng,
    };

    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/addresses`), newAddress);
      setAddresses([...addresses, { id: docRef.id, ...newAddress }]);
      setIsOpen(false);
      toast({ title: "Address saved successfully" });
      // Reset form
      setFlatNo(""); setArea(""); setLandmark(""); setCity(""); setCoords({});
    } catch (e: any) {
      toast({ title: "Failed to add address", description: e.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/addresses`, id));
      setAddresses(addresses.filter(a => a.id !== id));
      toast({ title: "Address deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user || !db) return;
    try {
      const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
      setAddresses(updated);
      for (const addr of addresses) {
        await updateDoc(doc(db, `users/${user.uid}/addresses`, addr.id), { isDefault: addr.id === id });
      }
      toast({ title: "Default address updated" });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Addresses...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black text-[#14532d] uppercase tracking-widest">Saved Addresses</h1>
      </div>

      <div className="p-4 space-y-4 container max-w-lg mx-auto">
        {addresses.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-black text-[#14532d] uppercase italic">No addresses saved</h3>
            <p className="text-muted-foreground mb-8">Save your Home or Work address for faster delivery.</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id} className={`border-none shadow-sm overflow-hidden transition-all ${addr.isDefault ? 'ring-2 ring-[#14532d]' : ''}`}>
              <CardContent className="p-4 flex gap-4">
                <div className={`p-3 rounded-xl h-fit ${addr.isDefault ? 'bg-[#14532d] text-white' : 'bg-[#f1f2f6] text-muted-foreground'}`}>
                  {labelIcons[addr.label]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-[#14532d] tracking-widest bg-[#14532d]/10 px-2 py-0.5 rounded-full">
                        {addr.label}
                      </span>
                      {addr.latitude && (
                        <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                          <Navigation className="h-2 w-2 fill-current" /> GPS PINNED
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDelete(addr.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-black text-[#333333] leading-tight">
                    {addr.flatNo}, {addr.area}
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase">
                    {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    {addr.isDefault ? (
                      <span className="text-[9px] font-black text-[#14532d] uppercase flex items-center gap-1">
                        <Check className="h-3 w-3" /> Default Address
                      </span>
                    ) : (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => handleSetDefault(addr.id)}
                        className="p-0 h-auto text-[9px] font-black text-[#14532d] uppercase"
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2">
              ADD NEW ADDRESS <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#14532d] uppercase tracking-widest">New Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Button 
                onClick={handleDetectLocation}
                disabled={isDetecting}
                variant="outline"
                className="w-full h-12 border-dashed border-[#14532d] text-[#14532d] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
              >
                {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {coords.lat ? "GPS LOCATION PINNED!" : "DETECT CURRENT LOCATION"}
              </Button>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Save as</Label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map(l => (
                    <Button 
                      key={l}
                      variant={label === l ? 'default' : 'outline'}
                      onClick={() => setLabel(l)}
                      className={`flex-1 font-black text-[10px] uppercase h-10 ${label === l ? 'bg-[#14532d]' : ''}`}
                    >
                      {l}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Flat / House / Building No.</Label>
                <Input value={flatNo} onChange={e => setFlatNo(e.target.value)} className="font-bold" placeholder="e.g. A-101, Galaxy Apts" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Area / Locality</Label>
                <Input value={area} onChange={e => setArea(e.target.value)} className="font-bold" placeholder="e.g. Andheri West" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Landmark (Optional)</Label>
                <Input value={landmark} onChange={e => setLandmark(e.target.value)} className="font-bold" placeholder="e.g. Near City Mall" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} className="font-bold" placeholder="Mumbai" />
              </div>

              <Button 
                onClick={handleAddAddress} 
                disabled={isAdding}
                className="w-full h-12 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl"
              >
                {isAdding ? "SAVING..." : "SAVE ADDRESS"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
