
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

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
  const router = useRouter();
  const { toast } = useToast();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setPhoneNumber(`+91${values.phone}`);
    toast({
      title: "OTP Sent (Demo Mode)",
      description: `Use any 6 digits to verify.`,
    });
    setStep('otp');
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    // Mock successful login
    const mockUser = {
        uid: 'customer-1',
        email: 'demo-user@example.com',
        displayName: 'Demo Customer',
        role: 'customer'
    };
    localStorage.setItem('zapizza-mock-session', JSON.stringify(mockUser));
    toast({
      title: "Login Successful (Demo Mode)",
      description: "Welcome to Zapizza!",
    });
    window.location.href = '/home';
  }

  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-3 h-14 w-14 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary">Welcome to Zapizza</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div key="phone" initial="hidden" animate="visible" exit="exit" variants={variants}>
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-3">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Mobile Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">+91</span>
                          <Input placeholder="98765 43210" {...field} className="pl-12 h-11" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                  Send OTP
                </Button>
                
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 text-xs" 
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
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-3">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Enter OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} className="h-11" />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Demo: Any 6 digits will work.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                  Verify & Login
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep('phone')} className="w-full text-xs">
                  Change number
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6 text-center text-xs">
        <p className="text-muted-foreground">
          Are you an admin or franchise owner?
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Button variant="link" asChild className="h-auto p-0 text-xs">
            <Link href="/admin/login">Admin Login</Link>
          </Button>
          <Button variant="link" asChild className="h-auto p-0 text-xs">
            <Link href="/franchise/login">Franchise Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
