"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function generateStaticParams() {
  return [{ orderId: 'id' }];
}

export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/delivery');
  }, [router]);
  return null;
}