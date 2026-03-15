
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZapizzaLogo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, PartyPopper, BellRing, ShieldCheck, MapPin } from "lucide-react";
import { requestForToken } from "@/firebase/messaging";

type OnboardingStep = "notifications" | "location" | "info";

export default function OnboardingPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [step, setStep] = useState<OnboardingStep>("notifications");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.replace("/login");
      } else if (db) {
        const verifyProfile = async () => {
          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
        
            if (docSnap.exists()) {
              const data = docSnap.data();
        
              // User is onboarded if they have a role and display name
              if (data.displayName && data.role === "customer") {
                router.replace("/home");
                return;
              }
            }
        
            // User is missing info, start sequence
            setIsChecking(false);
        
          } catch (e) {
            console.error("Profile check failed:", e);
            setIsChecking(false);
          }
        };
        verifyProfile();
      }
    }
  }, [user, userLoading, router, db]);

  const handleNotificationPermission = async () => {
    setIsRequesting(true);
    try {
      // Direct call to trigger browser popup immediately
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await requestForToken();
        if (token && db && user) {
          await setDoc(doc(db, "users", user.uid), {
            fcmToken: token,
            uid: user.uid,
            role: "customer"
          }, { merge: true });
          toast({ title: "Notifications enabled!" });
        }
      } else {
        toast({ title: "Notifications skipped" });
      }
    } catch (e) {
      console.error("Notification sequence error", e);
    } finally {
      setIsRequesting(false);
      setStep("location");
    }
  };

  const handleLocationPermission = async () => {
    setIsRequesting(true);
    try {
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              toast({ title: "Location captured!" });
              resolve(pos);
            },
            (err) => {
              console.warn("Location denied", err);
              toast({ title: "Location skipped", variant: "destructive" });
              resolve(null); 
            },
            { timeout: 5000, enableHighAccuracy: true }
          );
        });
      }
    } catch (e) {
      console.warn("Geolocation skipped");
    } finally {
      setIsRequesting(false);
      setStep("info");
    }
  };

  const handleFinish = async () => {
    if (!name || !db || !user) {
      toast({ variant: "destructive", title: "Wait!", description: "Please enter your name to continue." });
      return;
    }

    setIsSaving(true);
    const profileData = {
      uid: user.uid,
      displayName: name,
      email: email || user.email || "",
      phoneNumber: user.phoneNumber || "",
      birthday: birthday,
      role: "customer",
      loyaltyPoints: 0,
    };

    try {
      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
      toast({ title: "Profile Ready!", description: "Let's grab some pizza!" });
      router.push("/home");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || isChecking) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-4">
        <ZapizzaLogo className="h-16 w-16 text-primary animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-headline">Authenticating Identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === "notifications" && (
          <motion.div 
            key="notifications"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[40px] shadow-xl border border-gray-100"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center">
                <BellRing className="h-10 w-10 text-indigo-600" />
              </div>
              <div className="space-y-1 text-left w-full">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#333] font-headline">Stay Updated</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-headline">Get real-time order alerts & rewards</p>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <ShieldCheck className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed font-headline">
                  We'll notify you when your pizza is in the oven and when the rider is near your door.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleNotificationPermission}
                disabled={isRequesting}
                className="w-full h-14 bg-indigo-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900/20 gap-2 text-sm font-headline"
              >
                {isRequesting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    ENABLE NOTIFICATIONS <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep("location")}
                className="w-full h-12 text-muted-foreground font-black uppercase text-[10px] tracking-widest font-headline"
              >
                NOT NOW, MAYBE LATER
              </Button>
            </div>
          </motion.div>
        )}

        {step === "location" && (
          <motion.div 
            key="location"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[40px] shadow-xl border border-gray-100"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-emerald-600" />
              </div>
              <div className="space-y-1 text-left w-full">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#333] font-headline">Nearby Feasts</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-headline">Find your nearest Zapizza outlet</p>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed font-headline">
                  Your location helps us calculate accurate delivery times and show the menu for your specific area.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleLocationPermission}
                disabled={isRequesting}
                className="w-full h-14 bg-emerald-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 gap-2 text-sm font-headline"
              >
                {isRequesting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    SHARE LOCATION <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep("info")}
                className="w-full h-12 text-muted-foreground font-black uppercase text-[10px] tracking-widest font-headline"
              >
                SET MANUALLY LATER
              </Button>
            </div>
          </motion.div>
        )}

        {step === "info" && (
          <motion.div 
            key="info"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[40px] shadow-xl border border-gray-100"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-[#14532d]/10 flex items-center justify-center">
                <ZapizzaLogo className="h-12 w-12 text-[#14532d]" />
              </div>
              <div className="space-y-1 text-left w-full">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#333] font-headline">Personalize</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-headline">Complete your profile for special treats</p>
              </div>
            </div>

            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#333] font-headline">Your Full Name *</Label>
                <Input 
                  placeholder="e.g. John Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="h-12 rounded-2xl font-bold border-gray-100 bg-gray-50/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#333] font-headline">Email Address (Optional)</Label>
                <Input 
                  placeholder="name@example.com" 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-2xl font-bold border-gray-100 bg-gray-50/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#333] font-headline">Birthday (Optional)</Label>
                  <span className="text-[8px] font-black text-[#14532d] uppercase flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full font-headline">
                    <PartyPopper className="h-2 w-2" /> Surprise inside
                  </span>
                </div>
                <Input 
                  type="date"
                  value={birthday} 
                  onChange={e => setBirthday(e.target.value)}
                  className="h-12 rounded-2xl font-bold border-gray-100 bg-gray-50/50"
                />
              </div>
            </div>

            <Button 
              onClick={handleFinish}
              disabled={isSaving || !name}
              className="w-full h-14 bg-[#14532d] text-white rounded-[20px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 gap-2 text-sm font-headline"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  START FEASTING <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-tight font-headline">
              By continuing, you agree to our Terms of Service.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
