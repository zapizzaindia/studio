"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Wallet, 
  MapPin, 
  HelpCircle, 
  RefreshCcw, 
  AlertCircle, 
  Share2, 
  Star, 
  ShieldCheck, 
  FileText, 
  Truck,
  Phone,
  Navigation,
  ChevronRight,
  Cake,
  Crown,
  BellRing,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser, useDoc, useFirestore, useAuth } from "@/firebase";
import type { UserProfile, Outlet } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { requestForToken } from "@/firebase/messaging";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  
  const [savedOutletId, setSavedOutletId] = useState<string | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isPermissionLoading, setIsPermissionLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('zapizza-outlet');
    if (saved) {
      try { setSavedOutletId(JSON.parse(saved).id); } catch(e) {}
    }
  }, []);

  // Sync toggle state with profile and system permissions
  useEffect(() => {
    if (profile?.fcmToken) {
      setIsNotificationsEnabled(true);
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [profile]);

  const { data: outlet } = useDoc<Outlet>('outlets', savedOutletId || 'dummy');

  const [isHydrated, setIsHydrated] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBirthday, setNewBirthday] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (profile) {
      setNewDisplayName(profile.displayName || "");
      setNewEmail(profile.email || "");
      setNewBirthday(profile.birthday || "");
    }
  }, [profile]);

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;
    let points = 0;
    if (profile.displayName) points += 33;
    if (profile.email) points += 33;
    if (profile.birthday) points += 34;
    return points;
  }, [profile]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.replace('/login');
  };

  const handleToggleNotifications = async (checked: boolean) => {
    if (!user || !db) return;

    // 1. Turning OFF
    if (!checked) {
      setIsNotificationsEnabled(false);
      updateDoc(doc(db, 'users', user.uid), { fcmToken: null })
        .then(() => toast({ title: "Notifications Paused" }))
        .catch(() => {});
      return;
    }

    // 2. Turning ON
    setIsPermissionLoading(true);
    try {
      const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;

      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
          setIsNotificationsEnabled(true);
          toast({ title: "Signal Established", description: "Native push is active." });
        } else {
          throw new Error("Denied");
        }
      } else {
        // PWA Web Flow
        const token = await requestForToken();
        if (token) {
          await setDoc(doc(db, 'users', user.uid), { 
            fcmToken: token,
            lastTokenSync: new Date().toISOString()
          }, { merge: true });
          setIsNotificationsEnabled(true);
          toast({ title: "Notifications Enabled", description: "You'll now receive live order updates." });
        } else {
          throw new Error("Denied");
        }
      }
    } catch (e) {
      setIsNotificationsEnabled(false);
      toast({ 
        variant: "destructive", 
        title: "Permission Denied", 
        description: "Please enable notifications in your device settings." 
      });
    } finally {
      setIsPermissionLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !db) return;
    
    const userRef = doc(db, 'users', user.uid);
    const updatedData = {
      displayName: newDisplayName,
      email: newEmail,
      birthday: newBirthday,
    };

    setDoc(userRef, updatedData, { merge: true })
      .then(() => {
        setIsEditDialogOpen(false);
        toast({ title: "Profile Updated" });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (!isHydrated || userLoading || profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8f9fa] items-center justify-center p-6">
        <Loader2 className="h-12 w-12 rounded-full animate-spin mb-4 text-[#14532d]" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-headline">Loading Profile...</p>
      </div>
    );
  }

  const menuItems = [
    { label: "My Orders", icon: <ShoppingBag className="h-5 w-5" />, href: "/home/orders" },
    { label: "LP Rewards", icon: <Wallet className="h-5 w-5" />, href: "/home/rewards" },
    { label: "Manage Addresses", icon: <MapPin className="h-5 w-5" />, href: "/home/addresses" },
    { label: "FAQs", icon: <HelpCircle className="h-5 w-5" />, href: "#" },
    { label: "How to track my Refund?", icon: <RefreshCcw className="h-5 w-5" />, href: "#" },
    { label: "Raise a Concern", icon: <AlertCircle className="h-5 w-5" />, href: "#" },
    { label: "Share this App", icon: <Share2 className="h-5 w-5" />, href: "#" },
    { label: "Rate Us", icon: <Star className="h-5 w-5" />, href: "#" },
    { label: "Privacy Policy", icon: <ShieldCheck className="h-5 w-5" />, href: "#" },
    { label: "Terms & Conditions", icon: <FileText className="h-5 w-5" />, href: "#" },
    { label: "Shipping Policy", icon: <Truck className="h-5 w-5" />, href: "#" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-12">
      <div className="bg-[#14532d] text-white px-6 pt-4 pb-10 rounded-b-[40px] shadow-lg relative overflow-hidden font-headline">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/home')}
              className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (profile) {
                    setNewDisplayName(profile.displayName || "");
                    setNewEmail(profile.email || "");
                    setNewBirthday(profile.birthday || "");
                }
            }}>
              <DialogTrigger asChild>
                <button className="text-[10px] font-black uppercase tracking-widest border-b border-white/40 pb-0.5">
                  EDIT
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] rounded-2xl p-6 font-headline">
                <DialogHeader>
                  <DialogTitle className="text-[#14532d] font-black uppercase tracking-widest text-left">Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 text-left">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Name</Label>
                    <Input 
                      value={newDisplayName} 
                      onChange={e => setNewDisplayName(e.target.value)}
                      className="font-bold h-12 rounded-xl"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</Label>
                    <Input 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)}
                      className="font-bold h-12 rounded-xl"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Birthday</Label>
                    <Input 
                      type="date"
                      value={newBirthday} 
                      onChange={e => setNewBirthday(e.target.value)}
                      className="font-bold h-12 rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateProfile} className="w-full h-14 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all">
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex justify-between items-end text-left">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight italic uppercase leading-none">{profile?.displayName || 'Gourmet'}</h1>
              <p className="text-xs font-bold text-white/70 tracking-widest font-roboto tabular-nums">+91-{user?.phoneNumber?.slice(-10) || profile?.phoneNumber?.slice(-10) || '0000000000'}</p>
              {profile?.birthday && (
                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] flex items-center gap-1">
                  <Cake className="h-3 w-3" /> {new Date(profile.birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/80">
              <span>Complete your profile</span>
              <span className="font-roboto tabular-nums">{completionPercentage}%</span>
            </div>
            <div className="relative h-2.5 w-full bg-black/20 rounded-full overflow-hidden border border-white/5">
              <Progress value={completionPercentage} className="h-full bg-white transition-all duration-1000" />
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="px-4 -mt-6 space-y-4 relative z-20">
        <Card className="border-orange-200 bg-orange-50/50 rounded-[24px] overflow-hidden shadow-xl">
          <div className="bg-orange-100/50 px-6 py-3 border-b border-orange-200 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-black text-orange-800 uppercase tracking-widest font-headline">Needs Your Attention</span>
          </div>
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 text-left">
              <div className="mt-1">
                {isPermissionLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                ) : (
                  <BellRing className="h-6 w-6 text-[#333]" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#333] uppercase leading-tight font-headline">Push Notifications</h3>
                <p className="text-[11px] font-medium text-muted-foreground uppercase leading-relaxed font-headline">
                  Allow push notifications to stay updated on your order status and the latest offers and deals.
                </p>
              </div>
            </div>
            <Switch 
              checked={isNotificationsEnabled} 
              onCheckedChange={handleToggleNotifications}
              disabled={isPermissionLoading}
              className="data-[state=checked]:bg-orange-500 scale-110"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#14532d] flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                        <Crown className="h-7 w-7" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#14532d] font-headline">Loyalty Balance</p>
                        <h3 className="text-2xl font-black text-[#333] italic tracking-tighter font-headline"><span className="font-roboto tabular-nums">{profile?.loyaltyPoints || 0}</span> LP COINS</h3>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/home/rewards')}
                    className="h-10 w-10 rounded-full bg-gray-50 text-[#14532d]"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {menuItems.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => item.href !== '#' && router.push(item.href)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400 group-hover:text-[#14532d] transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[13px] font-bold text-[#333333] uppercase tracking-tight font-headline">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="mb-4 text-left">
              <h3 className="text-lg font-black text-[#14532d] uppercase italic tracking-tighter font-headline">
                {outlet?.name || 'Zapizza Rudrapur'}
              </h3>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 leading-relaxed uppercase font-headline">
                {outlet?.address || 'Location Details Not Available'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
              <Button variant="outline" className="h-12 rounded-2xl border-green-50 bg-green-50/30 text-[#14532d] font-black uppercase text-[10px] tracking-widest gap-2 font-headline">
                <Phone className="h-3.5 w-3.5" /> Call Outlet
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl border-green-50 bg-green-50/30 text-[#14532d] font-black uppercase text-[10px] tracking-widest gap-2 font-headline">
                <Navigation className="h-3.5 w-3.5" /> Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="py-10 text-center space-y-4 font-headline">
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] font-roboto tabular-nums">v2.8.5 (Gold Edition)</p>
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-[9px] font-bold text-[#333333] uppercase tracking-widest">Powered by</span>
            <div className="flex items-center gap-1 text-[#14532d] font-black italic text-sm">
              <ShoppingBag className="h-4 w-4" /> Zapizza Mesh
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-black text-red-500 uppercase tracking-widest pt-4 block w-full"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
