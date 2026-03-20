"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useUser, useAuth } from '@/firebase';

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
import { Loader2 } from 'lucide-react';

const phoneSchema = z.object({
  phone: z.string().min(10, { message: 'Please enter a valid 10-digit phone number.' }).max(10),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6),
});

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (typeof window === "undefined") return;
    if (!auth) return;
  
    // Initialize Recaptcha
    const timer = setTimeout(() => {
      if (!(window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible"
            }
          );
          (window as any).recaptchaVerifier.render();
        } catch (err) {
          console.error("Recaptcha init failed:", err);
        }
      }
    }, 500);
  
    return () => clearTimeout(timer);
  }, [auth]);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    if (!auth || isProcessing) return;

    setIsProcessing(true);
    try {
      const phone = `+91${values.phone}`;
  
      if (!(window as any).recaptchaVerifier) {
        toast({ title: "Initializing security check...", description: "Please try again in a moment." });
        setIsProcessing(false);
        return;
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, phone, (window as any).recaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;
      toast({ title: "OTP Sent", description: `Verify your number +91-${values.phone}` });
      setStep("otp");
    } catch (error: any) {
      console.error("OTP Error:", error);
      toast({ title: "OTP Failed", description: "Too many attempts or invalid number. Please try later.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }  

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    if (!(window as any).confirmationResult || isProcessing) return;

    setIsProcessing(true);
    try {
      await (window as any).confirmationResult.confirm(values.otp);
      toast({ title: "Login Successful", description: "Welcome to Zapizza!" });
      // Redirection is handled by the useEffect above
    } catch (error: any) {
      setIsProcessing(false);
      toast({ title: "Invalid OTP", description: "Please check the code and try again.", variant: "destructive" });
    }
  }  

  const variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  if (userLoading || !auth) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <ZapizzaLogo className="h-16 w-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6">
      <div className="mb-12 flex flex-col items-center text-center">
        <ZapizzaLogo className="h-24 w-24 text-primary" />
        <h1 className="font-headline text-2xl font-black uppercase italic tracking-tighter text-primary mt-4">Zapizza</h1>
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
                <Button type="submit" disabled={isProcessing} className="w-full h-12 bg-[#14532d] text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 font-headline">
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
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
                <Button type="submit" disabled={isProcessing} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 font-headline">
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Login"}
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep('phone')} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground font-headline">
                  Change number
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
}
