
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZapizzaLogo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, PartyPopper } from "lucide-react";

export default function OnboardingPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [user, userLoading, router]);

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

  if (userLoading) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[40px] shadow-xl border border-gray-100"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-[#14532d]/10 flex items-center justify-center">
            <ZapizzaLogo className="h-12 w-12 text-[#14532d]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#333]">Almost There!</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Help us know you better for special treats</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-[#333]">Your Full Name *</Label>
            <Input 
              placeholder="e.g. John Doe" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="h-12 rounded-2xl font-bold border-gray-100 bg-gray-50/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-[#333]">Email Address (Optional)</Label>
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
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#333]">Birthday (Optional)</Label>
              <span className="text-[8px] font-black text-[#14532d] uppercase flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
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
          className="w-full h-14 bg-[#14532d] text-white rounded-[20px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 gap-2 text-sm"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <>
              START FEASTING <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
          By continuing, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}
