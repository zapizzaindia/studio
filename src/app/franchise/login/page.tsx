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

export default function FranchiseLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    // Mock franchise login
    console.log(`Franchise login attempt for ${values.email}`);
    if (values.email === 'franchise@zapizza.com' && values.password === 'password') {
      toast({
        title: "Franchise Login Successful!",
        description: "Welcome to the Franchise Dashboard!",
      });
      router.push('/franchise/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Credentials",
        description: "The email or password you entered is incorrect.",
      });
      form.setError("email", { type: "manual", message: " " });
      form.setError("password", { type: "manual", message: "Invalid credentials" });
    }
  }

  return (
    <div className="w-full max-w-sm p-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <ZapizzaLogo className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-headline text-3xl font-bold text-primary">Franchise Login</h1>
        <p className="text-muted-foreground">Sign in to the franchise dashboard</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="franchise@zapizza.com" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
