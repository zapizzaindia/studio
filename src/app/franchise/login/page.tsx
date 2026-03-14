
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
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function FranchiseLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  
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
          description: "Authenticated with Firebase Security.",
        });
        router.push('/franchise/dashboard');
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: "Authentication Failed",
          description: "Invalid credentials or account not authorized.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-3 h-14 w-14 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary">Franchise Portal</h1>
        <p className="text-sm text-muted-foreground">Sign in to the global dashboard</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Corporate Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@zapizza.co.in" {...field} className="h-11" />
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
                <FormLabel className="text-xs">Security Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold mt-4 shadow-lg">
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Identity"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Backend Ready</p>
        <p className="text-[9px] text-blue-600 mt-1 uppercase font-bold">Use your provided credentials to access master settings.</p>
      </div>
    </div>
  );
}
