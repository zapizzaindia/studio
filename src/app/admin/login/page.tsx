
"use client";

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

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@zapizza.com', password: 'password' },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    // Mock successful admin login
    const mockAdmin = {
        uid: 'admin-1',
        email: values.email,
        displayName: 'Demo Admin',
        role: 'outlet-admin',
        outletId: 'andheri'
    };
    localStorage.setItem('zapizza-mock-session', JSON.stringify(mockAdmin));
    
    toast({
      title: "Admin Login Successful (Demo Mode)",
      description: "Opening Live Orders...",
    });
    // Redirect directly to Orders page as requested
    window.location.href = '/admin/dashboard/orders';
  }

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-3 h-14 w-14 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary">Admin Login</h1>
        <p className="text-sm text-muted-foreground">Sign in to manage live orders</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Email</FormLabel>
                <FormControl>
                  <Input placeholder="admin@zapizza.com" {...field} className="h-11" />
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
                <FormLabel className="text-xs">Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
