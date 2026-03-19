"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function generateStaticParams() {
  return [{ outletId: 'id' }];
}

export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/home/reviews');
  }, [router]);
  return null;
}
