
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) {
        toast({ variant: 'destructive', title: 'System Error', description: 'Authentication service is not available.' });
        return;
    }

    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Identity Verified",
        description: "Accessing kitchen pipeline...",
      });
      // The Admin Layout will handle role verification and outlet routing
      router.push('/admin/dashboard/orders');
    } catch (error: any) {
      console.error("Login Error:", error.code);
      
      let errorMessage = "Invalid email or password.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "This admin account has not been created in the Auth tab yet.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password for this admin account.";
      }

      toast({
        variant: 'destructive',
        title: "Login Denied",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-3 h-14 w-14 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary italic">Kitchen Terminal</h1>
        <p className="text-sm text-muted-foreground uppercase font-black tracking-widest text-[10px] opacity-60">Authorized Entry Only</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">Admin Email</FormLabel>
                <FormControl>
                  <Input placeholder="manager@zapizza.co.in" {...field} className="h-12 rounded-xl font-bold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl shadow-lg mt-4">
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Open Kitchen Pipeline"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
        <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wide leading-relaxed">
          Admin profiles must be "Authorized" in the Super Admin dashboard AND have their login created in the Firebase Auth console.
        </p>
      </div>
    </div>
  );
}
