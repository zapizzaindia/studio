"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import type { AppBanner } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const db = useFirestore();

  const [isMounted, setIsMounted] = useState(false);
  const [promoBanner, setPromoBanner] = useState<AppBanner | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    setIsMounted(true);

    const ua = navigator.userAgent;
    const mobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);

    setIsMobile(mobile);
  }, []);

  // Desktop redirect
  useEffect(() => {
    if (!isMounted) return;

    if (!isMobile) {
      router.replace("/home");
    }
  }, [isMounted, isMobile]);

  // Fetch promo banner
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

          setPromoBanner(banner);

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
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
        onClick={handleBannerClick}
      >

        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0"
        >
          <Image
            src={bannerImage}
            alt="Zapizza Splash"
            fill
            sizes="100vw"
            priority
            unoptimized
            className="object-cover"
          />
        </motion.div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 text-[10px] text-white font-black uppercase tracking-widest">
            Loading Zapizza...
          </div>
        </div>

      </motion.div>

    </main>
  );
}