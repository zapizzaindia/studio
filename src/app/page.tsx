
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZapizzaLogo } from '@/components/icons';
import { useUser } from '@/firebase';

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;

    const timer = setTimeout(() => {
      // Intelligent redirection:
      // If user is already logged in, go to home.
      // Otherwise, go to login.
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isMounted, loading, user, router]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background p-6">
      <div className="flex animate-pulse items-center justify-center mb-4">
        <ZapizzaLogo className="h-24 w-24 md:h-32 md:w-32 text-primary" />
      </div>
      <h1 className="font-headline text-4xl font-black text-[#14532d] uppercase tracking-tighter italic">Zapizza</h1>
      <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] mt-2 opacity-60">Super fast. Super delicious.</p>
    </main>
  );
}
