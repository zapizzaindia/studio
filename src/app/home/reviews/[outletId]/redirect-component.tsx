"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RedirectToReviews() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/home/reviews');
  }, [router]);
  return null;
}
