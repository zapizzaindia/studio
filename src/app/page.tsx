"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import type { AppBanner } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";

/**
 * SplashPage - The initial entry point of the PWA.
 * Features:
 * 1. Cache-First Rendering: Displays the last known banner instantly from localStorage.
 * 2. Background Sync: Fetches the latest banner from Firestore and caches it for next time.
 * 3. Priority Loading: Uses next/image priority to ensure minimal LCP.
 */
export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const db = useFirestore();

  const [isMounted, setIsMounted] = useState(false);
  const [promoBanner, setPromoBanner] = useState<AppBanner | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device and restore cached banner for instant load
  useEffect(() => {
    setIsMounted(true);

    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
    setIsMobile(mobile);

    // Instant Caching Logic: Load from localStorage if available
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

  // Desktop redirect
  useEffect(() => {
    if (!isMounted) return;
    if (!isMobile) {
      router.replace("/home");
    }
  }, [isMounted, isMobile, router]);

  // Fetch latest promo banner and update cache
  useEffect(() => {
    if (!isMounted || !db || !isMobile) return;

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

          // Update state and refresh localStorage cache for next launch
          setPromoBanner(banner);
          localStorage.setItem("zapizza-splash-cache", JSON.stringify(banner));

          // Proactive Preloading: Ensure the browser caches the physical image asset
          const img = new globalThis.Image();
          img.src = banner.imageUrl;

          setTimeout(() => {
            finishSplash();
          }, (banner.duration || 3) * 1000);
        } else {
          setTimeout(finishSplash, 2500);
        }
      } catch (e) {
        console.error("Promo fetch error", e);
        setTimeout(finishSplash, 2500);
      }
    };

    checkPromo();
  }, [isMounted, db, isMobile]);

  const finishSplash = () => {
    if (loading) return;

    if (user) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  };

  const handleBannerClick = () => {
    if (promoBanner?.deepLink) {
      router.push(promoBanner.deepLink);
    }
  };

  if (!isMounted || !isMobile) return null;

  const bannerImage = promoBanner?.imageUrl || "/splash-fallback.jpg";

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0"
        onClick={handleBannerClick}
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0"
        >
          <Image
            src={bannerImage}
            alt="Zapizza Splash"
            fill
            sizes="100vw"
            priority // Critical: Loads the image as a high-priority asset
            unoptimized // Bypass Next.js processing for remote URLs to speed up initial hit
            className="object-cover"
          />
        </motion.div>

        {/* Branding Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        <div className="absolute bottom-12 left-0 right-0 flex justify-center">
          <div className="bg-black/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 text-[10px] text-white font-black uppercase tracking-[0.2em] shadow-2xl">
            Synchronizing Terminal...
          </div>
        </div>
      </motion.div>
    </main>
  );
}
