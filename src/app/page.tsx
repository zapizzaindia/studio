
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { AppBanner } from '@/lib/types';
import { motion } from 'framer-motion';
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
    <main className="fixed inset-0 bg-black overflow-hidden">
  
      {promoBanner && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: "easeOut" }
          }}
          className="absolute inset-0"
          onClick={handleBannerClick}
        >
  
          {/* subtle floating animation */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
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
      )}
  
    </main>
  );
}