
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BellRing, Send, Smartphone, Users, Globe, Loader2, Info, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useCollection } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from '@/lib/types';
import { broadcastPushNotification } from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ZapizzaLogo } from "@/components/icons";

export default function FranchiseNotificationsPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [deepLink, setDeepLink] = useState("/home/offers");
  const [isSending, setIsSending] = useState(false);

  // Filter users who have allowed notifications (have an fcmToken)
  const usersWithTokens = users?.filter(u => !!u.fcmToken) || [];
  const tokenCount = usersWithTokens.length;

  const handleBroadcast = async () => {
    if (!title || !body) {
      toast({ variant: 'destructive', title: 'Missing Content', description: 'Please provide at least a title and message body.' });
      return;
    }

    if (tokenCount === 0) {
      toast({ variant: 'destructive', title: 'No Targets', description: 'Zero users have opted-in for notifications currently.' });
      return;
    }

    setIsSending(true);
    try {
      const tokens = usersWithTokens.map(u => u.fcmToken!);
      const result = await broadcastPushNotification({
        title,
        body,
        imageUrl,
        deepLink,
        tokens
      });

      if (result.success) {
        toast({ title: 'Broadcast Success', description: result.message });
        setTitle(""); setBody(""); setImageUrl("");
      } else {
        toast({ variant: 'destructive', title: 'Broadcast Failed', description: result.message });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'System Error', description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-0 space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tighter italic text-primary">
                Marketing Pushes
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> Direct Device Engagement
            </p>
        </div>
        <div className="flex items-center gap-3 bg-muted/30 px-6 py-3 rounded-2xl border">
            <div className="flex flex-col items-end">
                <span className="text-xl font-black font-roboto tabular-nums leading-none">{tokenCount}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Subscribed Devices</span>
            </div>
            <Smartphone className="h-8 w-8 text-primary opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Composer */}
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                    <BellRing className="h-5 w-5 text-primary" /> Notification Composer
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Craft your broadcast message</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Alert Title</Label>
                    <Input 
                        placeholder="e.g. 🍕 Buy 1 Get 1 FREE Today!" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="h-12 rounded-xl font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Message Body</Label>
                    <Textarea 
                        placeholder="Tell your customers something exciting..." 
                        value={body} 
                        onChange={e => setBody(e.target.value)}
                        className="min-h-[100px] rounded-xl font-medium text-sm"
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                            <ImageIcon className="h-3 w-3" /> Visual Asset URL (Optional)
                        </Label>
                        <Input 
                            placeholder="https://..." 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)}
                            className="h-11 rounded-xl text-xs font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Deep Link Redirect</Label>
                        <Input 
                            placeholder="/home/offers" 
                            value={deepLink} 
                            onChange={e => setDeepLink(e.target.value)}
                            className="h-11 rounded-xl text-xs font-bold font-code"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        onClick={handleBroadcast} 
                        disabled={isSending || tokenCount === 0}
                        className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                        {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <>
                                Blast Notification <Send className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                    <p className="text-[8px] text-center text-muted-foreground uppercase font-bold tracking-widest mt-4">
                        Messages will be delivered to foreground & background devices.
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Live Preview */}
        <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Smartphone Preview</h2>
            
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl overflow-hidden">
                <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                
                <div className="bg-gray-100 h-full w-full relative flex flex-col p-4">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-8 px-2">
                        <span>9:41</span>
                        <div className="flex gap-1">
                            <Users className="h-3 w-3" />
                            <BellRing className="h-3 w-3" />
                        </div>
                    </div>

                    {/* Notification Alert */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                <ZapizzaLogo className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-primary">Zapizza</span>
                                    <span className="text-[8px] text-gray-400">now</span>
                                </div>
                                <h4 className="text-sm font-black text-gray-900 leading-tight uppercase mt-0.5 truncate">
                                    {title || "Notification Title"}
                                </h4>
                                <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                                    {body || "Your message content will appear here once you start typing in the composer..."}
                                </p>
                            </div>
                        </div>
                        {imageUrl && (
                            <div className="mt-3 relative h-32 w-full rounded-xl overflow-hidden border border-gray-100">
                                <img src={imageUrl} alt="Banner" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="mt-auto mb-4 flex justify-center">
                        <div className="h-1 w-20 bg-gray-300 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px] flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-amber-900 uppercase">Policy Check</p>
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase mt-1">
                        Frequent broadcasting may lead to users disabling notifications. Use "Rich Assets" (Images) for higher engagement rates.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
