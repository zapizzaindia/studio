
"use client";
declare global {
  interface Window {
    fcmToken?: string;
    confirmationResult: any;
    recaptchaVerifier: any;
  }
}

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useUser, useAuth, db } from '@/firebase';
import { doc, setDoc } from "firebase/firestore";

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ZapizzaLogo } from '@/components/icons';

import { useToast } from '@/hooks/use-toast';
import { requestForToken } from '@/firebase/messaging';

const phoneSchema = z.object({
  phone: z.string().min(10, { message: 'Please enter a valid 10-digit phone number.' }).max(10),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6),
});

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!userLoading && user) {
      router.replace("/home/onboarding");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    handleNotificationPermission();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!auth) return;
  
    const timer = setTimeout(() => {
      if (!window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible"
            }
          );
  
          window.recaptchaVerifier.render();
          console.log("Recaptcha initialized");
        } catch (err) {
          console.error("Recaptcha init failed:", err);
        }
      }
    }, 500);
  
    return () => clearTimeout(timer);
  }, [auth]);
    
  async function handleNotificationPermission() {
    try {
      const isNative = typeof window !== "undefined" && !!(window as any).Capacitor;
  
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
  
        const perm = await PushNotifications.requestPermissions();
  
        if (perm.receive === 'granted') {
          await PushNotifications.register();
  
          PushNotifications.addListener('registration', (token: any) => {
            console.log("Native Token Captured:", token.value);
            window.fcmToken = token.value;
          });

          PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Registration error: ' + JSON.stringify(error));
          });
        }
  
      } else {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const token = await requestForToken();
            if (token) window.fcmToken = token;
          }
        }
      }
    } catch (e) {
      console.error("Notification setup error:", e);
    }
  }

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    if (!auth) {
      toast({ title: "Auth Error", variant: "destructive" });
      return;
    }

    try {
      const phone = `+91${values.phone}`;
      setPhoneNumber(phone);
  
      if (!window.recaptchaVerifier) {
        toast({ title: "Initializing security check...", description: "Please wait 1 second." });
        return;
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      toast({ title: "OTP Sent" });
      setStep("otp");
    } catch (error: any) {
      toast({ title: "OTP Failed", description: error.message, variant: "destructive" });
    }
  }  

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    try {
      if (!window.confirmationResult) throw new Error("Retry OTP");
      const result = await window.confirmationResult.confirm(values.otp);
      
      if (window.fcmToken && db) {
        await setDoc(doc(db, "users", result.user.uid), { fcmToken: window.fcmToken }, { merge: true });
      }
      
      toast({ title: "Login Successful" });
      router.push("/home/onboarding");
    } catch (error: any) {
      toast({ title: "Invalid OTP", variant: "destructive" });
    }
  }  

  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };

  if (userLoading || !auth) return null;

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-12 flex flex-col items-center text-center">
        <ZapizzaLogo className="h-24 w-24 text-primary" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div key="phone" initial="hidden" animate="visible" exit="exit" variants={variants}>
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground text-sm font-bold font-body tabular-nums">+91</span>
                          <Input placeholder="98765 43210" {...field} className="pl-12 h-12 rounded-xl border-gray-200 font-bold focus:ring-primary font-body tabular-nums" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 font-headline">
                  Send OTP
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-background px-4 text-muted-foreground font-headline">Or</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 text-[10px] font-black uppercase tracking-widest border-gray-200 rounded-xl font-headline" 
                  onClick={() => router.push('/home')}
                >
                  Skip for now
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div key="otp" initial="hidden" animate="visible" exit="exit" variants={variants}>
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enter OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} className="h-12 rounded-xl border-gray-200 font-black text-center text-xl tracking-[0.5em] focus:ring-primary font-body tabular-nums" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 font-headline">
                  Verify & Login
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep('phone')} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground font-headline">
                  Change number
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
      <div id="recaptcha-container"></div>
    </div>
  );
}
