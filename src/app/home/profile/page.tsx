"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Shield, Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useUser();
  const db = useFirestore();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !db) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName });
      
      // Update local session too for demo purposes
      const session = JSON.parse(localStorage.getItem('zapizza-mock-session') || '{}');
      session.displayName = displayName;
      localStorage.setItem('zapizza-mock-session', JSON.stringify(session));

      toast({ title: "Profile updated successfully" });
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black text-[#14532d] uppercase tracking-widest">My Profile</h1>
      </div>

      <div className="p-4 space-y-6 container max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={user?.photoURL} />
              <AvatarFallback className="bg-[#14532d] text-white text-2xl font-black">
                {user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-[#14532d] text-white rounded-full shadow-lg">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-[#333333] uppercase">{user?.displayName || 'User'}</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{user?.email}</p>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-sm font-black text-[#14532d] uppercase tracking-widest flex items-center gap-2">
              <User className="h-4 w-4" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Display Name</Label>
              <Input 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                className="font-bold border-gray-200 focus:border-[#14532d] focus:ring-[#14532d]"
              />
            </div>
            <div className="space-y-2 opacity-60">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={user?.email || ""} disabled className="pl-10 font-bold bg-muted" />
              </div>
              <p className="text-[9px] text-muted-foreground">Email cannot be changed for this account.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-sm font-black text-[#14532d] uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-4 w-4" /> Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 bg-white">
             <Button variant="outline" className="w-full justify-between font-black uppercase text-[11px] tracking-widest h-12">
               CHANGE PASSWORD <ArrowLeft className="h-4 w-4 rotate-180" />
             </Button>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full h-14 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          {isSaving ? "SAVING..." : <>SAVE CHANGES <Save className="h-5 w-5" /></>}
        </Button>
      </div>
    </div>
  );
}
