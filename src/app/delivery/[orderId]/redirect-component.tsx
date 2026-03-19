"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RedirectToDelivery() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/delivery');
  }, [router]);
  return null;
}
