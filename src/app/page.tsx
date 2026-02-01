"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZapizzaLogo } from '@/components/icons';

export default function SplashPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [isMounted, router]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex animate-pulse items-center justify-center">
        <ZapizzaLogo className="h-32 w-32 text-primary" />
      </div>
      <h1 className="mt-4 font-headline text-4xl font-bold text-primary">Zapizza</h1>
      <p className="text-muted-foreground">Super fast. Super delicious.</p>
    </main>
  );
}
