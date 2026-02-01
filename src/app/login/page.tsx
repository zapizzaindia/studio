"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

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
import { useAuth } from '@/firebase';

const phoneSchema = z.object({
  phone: z.string().min(10, { message: 'Please enter a valid 10-digit phone number.' }).max(10),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6),
});

type Step = 'phone' | 'otp';

// Extend window type to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!auth || window.recaptchaVerifier) return;
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        // console.log("reCAPTCHA verified");
      }
    });

  }, [auth]);

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Authentication service not ready.' });
      return;
    }
    const appVerifier = window.recaptchaVerifier;
    const fullPhoneNumber = `+91${values.phone}`;
    setPhoneNumber(fullPhoneNumber);

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      toast({
        title: "OTP Sent!",
        description: `An OTP has been sent to ${fullPhoneNumber}.`,
      });
      setStep('otp');
    } catch (error) {
        console.error("SMS not sent error", error);
        toast({
            variant: "destructive",
            title: "Failed to send OTP",
            description: "Please try again later or check your phone number.",
        });
    }
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    if (!confirmationResult) {
      toast({ variant: 'destructive', title: 'Something went wrong. Please try again.' });
      return;
    }
    try {
      await confirmationResult.confirm(values.otp);
      toast({
        title: "Login Successful!",
        description: "Welcome to Zapizza!",
      });
      router.push('/home');
    } catch (error) {
      console.error("OTP verification error", error);
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect. Please try again.",
      });
      otpForm.setError("otp", { type: "manual", message: "Invalid OTP" });
    }
  }

  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };

  return (
    <div className="w-full max-w-sm p-4">
      <div id="recaptcha-container"></div>
      <div className="mb-8 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-headline text-3xl font-bold text-primary">Welcome to Zapizza</h1>
        <p className="text-muted-foreground">Sign in to continue</p>
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
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">+91</span>
                          <Input placeholder="98765 43210" {...field} className="pl-12" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Send OTP
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
                      <FormLabel>Enter OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormDescription>
                        An OTP was sent to {phoneNumber}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Verify & Login
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep('phone')} className="w-full">
                  Change number
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-8 text-center text-sm">
        <p className="text-muted-foreground">
          Are you an admin or franchise owner?
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Button variant="link" asChild>
            <Link href="/admin/login">Admin Login</Link>
          </Button>
          <Button variant="link" asChild>
            <Link href="/franchise/login">Franchise Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
