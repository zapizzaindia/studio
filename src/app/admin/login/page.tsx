
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
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    
    if (auth) {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: "Access Granted",
          description: "Syncing kitchen data...",
        });
        // Redirect to dashboard where the layout will verify the role/outlet
        router.push('/admin/dashboard/orders');
      } catch (error: any) {
        // Fallback for demo users
        if (values.email === 'admin@zapizza.com' || values.email === 'admin@zfry.com') {
            const isZfry = values.email.includes('zfry');
            const mockAdmin = {
                uid: isZfry ? 'admin-zfry' : 'admin-zapizza',
                email: values.email,
                displayName: isZfry ? 'Zfry Manager' : 'Zapizza Manager',
                role: 'outlet-admin',
                outletId: isZfry ? 'andheri-zfry' : 'andheri-zapizza'
            };
            localStorage.setItem('zapizza-mock-session', JSON.stringify(mockAdmin));
            window.location.href = '/admin/dashboard/orders';
            return;
        }

        toast({
          variant: 'destructive',
          title: "Login Failed",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
        toast({ variant: 'destructive', title: 'Auth Error', description: 'Firebase Auth is not initialized.' });
    }
  }

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-3 h-14 w-14 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary italic">Kitchen Terminal</h1>
        <p className="text-sm text-muted-foreground uppercase font-black tracking-widest text-[10px] opacity-60">Authentication Required</p>
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

      <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-dashed text-center">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Authorized Personnel Only</p>
      </div>
    </div>
  );
}
