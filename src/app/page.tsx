
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import type { AppBanner } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ZapizzaLogo } from "@/components/icons";
import { Loader2 } from "lucide-react";

/**
 * SplashPage - The animated entry point of the PWA.
 */
export default function SplashPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const [isMounted, setIsMounted] = useState(false);
  const [promoBanner, setPromoBanner] = useState<AppBanner | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Instant Caching Logic
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("zapizza-splash-cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPromoBanner(parsed);
        } catch (e) {
          console.warn("Splash cache corrupt");
        }
      }
    }
  }, []);

  // Fetch latest promo banner and update cache
  useEffect(() => {
    if (!isMounted || !db) return;

    const checkPromo = async () => {
      try {
        const q = query(
          collection(db, "appBanners"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const banner = {
            id: snap.docs[0].id,
            ...snap.docs[0].data(),
          } as AppBanner;

          setPromoBanner(banner);
          localStorage.setItem("zapizza-splash-cache", JSON.stringify(banner));

          // Preload the image asset
          const img = new globalThis.Image();
          img.src = banner.imageUrl;

          setTimeout(() => setIsDataLoaded(true), (banner.duration || 3) * 1000);
        } else {
          setTimeout(() => setIsDataLoaded(true), 2000);
        }
      } catch (e) {
        console.error("Promo fetch error", e);
        setTimeout(() => setIsDataLoaded(true), 2000);
      }
    };

    checkPromo();
  }, [isMounted, db]);

  // Main Redirection Logic
  useEffect(() => {
    if (isDataLoaded && !authLoading) {
      if (user) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [isDataLoaded, authLoading, user, router]);

  if (!isMounted) return null;

  return (
    <main className="fixed inset-0 bg-white overflow-hidden flex flex-col items-center justify-center">
      {/* 1. Cinematic Fallback Layer */}
      <motion.div
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src="/splash-fallback.jpg"
          alt="Zapizza Background"
          fill
          priority
          className="object-cover"
        />
      </motion.div>

      {/* 2. Dynamic Promo Banner (Ken Burns Effect) */}
      <AnimatePresence>
        {promoBanner?.imageUrl && (
          <motion.div
            key={promoBanner.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-10"
          >
            <Image
              src={promoBanner.imageUrl}
              alt="Promo"
              fill
              priority
              unoptimized
              className="object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. High-Quality Brand Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none z-20" />

      {/* 4. Animated Central Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
        className="relative z-30 flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3, 
            ease: "easeInOut" 
          }}
        >
          <ZapizzaLogo className="h-24 w-24 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
        </motion.div>
      </motion.div>

      {/* 5. Terminal Status Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, type: "spring", stiffness: 100 }}
        className="absolute bottom-12 left-0 right-0 flex justify-center px-6 z-30"
      >
        <div className="bg-white/10 backdrop-blur-2xl px-8 py-3 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="text-[10px] text-white font-black uppercase tracking-[0.3em] text-center">
            Uplink Established
          </span>
        </div>
      </motion.div>
    </main>
  );
}
