import type { Metadata } from 'next';
import { WakeLock } from '@/components/wake-lock';

export const metadata: Metadata = {
  manifest: '/manifest-pos.json',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WakeLock />
      {children}
    </>
  );
}