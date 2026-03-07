
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZapizzaLogo } from '@/components/icons';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { AppBanner } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { orderBy } from "firebase/firestore";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const db = useFirestore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [promoBanner, setPromoBanner] = useState<AppBanner | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !db) return;

    const checkPromo = async () => {
      try {
        const q = query(
          collection(db, 'appBanners'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const banner = { id: snap.docs[0].id, ...snap.docs[0].data() } as AppBanner;
          setPromoBanner(banner);
          setShowPromo(true);
          
          // Hold for configured duration
          setTimeout(() => {
            finishSplash();
          }, banner.duration * 1000);
        } else {
          // No promo -> standard delay
          setTimeout(finishSplash, 2500);
        }
      } catch (e) {
        console.error("Promo fetch error", e);
        setTimeout(finishSplash, 2500);
      }
    };

    checkPromo();
  }, [isMounted, db]);

  const finishSplash = () => {
    if (loading) return; // Wait for auth to resolve
    if (user) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  };
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth <= 768);
    }
  }, []);

  const handleBannerClick = () => {
    if (promoBanner?.deepLink) {
      router.push(promoBanner.deepLink);
    }
  };

  if (!isMounted) return null;
  if (!isMobile) {
    router.replace('/home');
    return null;
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        {showPromo && promoBanner ? (
          <motion.div
          key="promo"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: "easeOut" }
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
            transition: { duration: 0.4 }
          }}
          className="absolute inset-0 z-50 bg-black"
          onClick={handleBannerClick}
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0"
          >
            <Image
              src={promoBanner.imageUrl}
              alt="Promotion"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </motion.div>
        
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 text-[10px] text-white font-black uppercase tracking-widest">
              Loading Zapizza...
            </div>
          </div>
        </motion.div>
        ) : (
          <motion.div 
            key="logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="flex animate-pulse items-center justify-center mb-4">
              <ZapizzaLogo className="h-24 w-24 md:h-32 md:w-32 text-primary" />
            </div>
            <h1 className="font-headline text-4xl font-black text-[#14532d] uppercase tracking-tighter italic">Zapizza</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] mt-2 opacity-60">Super fast. Super delicious.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
