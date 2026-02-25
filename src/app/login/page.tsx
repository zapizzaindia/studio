
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useUser } from '@/firebase';


import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ZapizzaLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

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
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in and navigates to /login, send them home
    if (!userLoading && user) {
      router.replace('/home');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
  
      window.recaptchaVerifier.render().catch(console.error);
    }
  }, []);
    
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    try {
      const phone = `+91${values.phone}`;
      setPhoneNumber(phone);
  
      const appVerifier = window.recaptchaVerifier;
  
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        appVerifier
      );
  
      window.confirmationResult = confirmationResult;
  
      toast({
        title: "OTP Sent",
        description: "Please enter the OTP sent to your phone",
      });
  
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "OTP Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }  

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    try {
      const result = await window.confirmationResult.confirm(values.otp);
      const user = result.user;
  
      toast({
        title: "Login Successful",
        description: "Welcome back to Zapizza!",
      });
  
      // Redirect to onboarding to check for profile details
      router.push("/home/onboarding");
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }  

  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };

  if (userLoading) return null;

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-4 h-12 w-12 text-primary" />
        <h1 className="font-headline text-3xl font-black text-[#14532d] uppercase tracking-tighter italic">Zapizza</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Sign in to feed your hunger</p>
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
                <Button type="submit" className="w-full h-12 bg-[#14532d] text-white hover:bg-[#0f4023] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 font-headline">
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
      <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest border-t border-gray-50 pt-6 font-headline">
        <p className="text-muted-foreground/60">
          Admin or Franchise Partner?
        </p>
        <div className="mt-3 flex justify-center gap-6">
          <Button variant="link" asChild className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-[#14532d]">
            <Link href="/admin/login">Admin Login</Link>
          </Button>
          <Button variant="link" asChild className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-[#14532d]">
            <Link href="/franchise/login">Franchise Login</Link>
          </Button>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}
