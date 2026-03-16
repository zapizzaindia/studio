
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import type { AppBanner } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { ZapizzaLogo } from "@/components/icons";
import { Loader2 } from "lucide-react";

/**
 * SplashPage - The initial entry point of the PWA.
 * Features:
 * 1. Universal Entry: Handles redirection for both Mobile and PC.
 * 2. Auth Gatekeeper: Ensures users are logged in before entering home.
 * 3. Priority Rendering: High-priority image loading for optimal LCP.
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

  const bannerImage = promoBanner?.imageUrl;

  return (
    <main className="fixed inset-0 bg-white overflow-hidden flex flex-col items-center justify-center">
      {bannerImage ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0"
        >
          <Image
            src={bannerImage}
            alt="Zapizza Splash"
            fill
            priority
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 pointer-events-none" />
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <ZapizzaLogo className="h-24 w-24 text-primary" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Finalizing Connection...
          </div>
        </div>
      )}

      {/* Persistence indicator for all users */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center px-6">
        <div className="bg-black/40 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10 text-[10px] text-white font-black uppercase tracking-[0.2em] shadow-2xl text-center">
          Secure Terminal Ready
        </div>
      </div>
    </main>
  );
}
