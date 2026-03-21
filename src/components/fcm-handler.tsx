'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/firebase/config';
import { requestForToken } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

/**
 * FCMHandler - Manages Firebase Cloud Messaging for both Web and Native (Capacitor).
 * It waits for a stable session before requesting permissions to avoid crashing 
 * during the high-load authentication/redirection phase on Android.
 */
export function FCMHandler() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 1. Wait for a definite authenticated user and an initialized DB
    // 2. Ensure we don't try to re-initialize if we're already set up
    if (!user || authLoading || !db || hasInitialized.current) return;

    const setupFCM = async () => {
      const profileId = user.email?.toLowerCase().trim();
if (!profileId) return;
      try {
        // Detect if we are running inside a Capacitor native shell
        const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;

        if (isNative) {
          console.log("FCM: Initializing Native Push Notifications...");
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            // Register listener for token generation
            await PushNotifications.addListener('registration', (token) => {
              console.log('FCM: Native token received');
              setDoc(doc(db, 'users', profileId), {
                fcmToken: token.value,
                lastTokenSync: new Date().toISOString()
              }, { merge: true }).catch(err => console.error("FCM Token Sync Error:", err));
            });

            // Register listener for incoming notifications while app is open
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
              toast({
                title: notification.title || "Zapizza Update",
                description: notification.body,
              });
            });

            // Trigger the native registration process
            await PushNotifications.register();
            hasInitialized.current = true;
          }

        } else {
          // Web/PWA Standard Flow
          if (typeof window !== 'undefined' && 'Notification' in window) {
            console.log("FCM: Initializing Web Push Notifications...");
            const token = await requestForToken();
            if (token) {
              await setDoc(doc(db, 'users', profileId), {
                fcmToken: token,
                lastTokenSync: new Date().toISOString()
              }, { merge: true });
              
              const messaging = getMessaging(app);
              onMessage(messaging, (payload) => {
                toast({
                  title: payload.notification?.title || "Notification",
                  description: payload.notification?.body,
                });
              });
              
              hasInitialized.current = true;
            }
          }
        }
      } catch (e) {
        // Log but don't crash the app if FCM fails (e.g. missing google-services.json)
        console.warn("FCM Handler Exception (Check native config):", e);
      }
    };

    // DEFER INITIALIZATION: 
    // We wait 3 seconds after the user lands on Home/Dashboard.
    // This ensures the device has finished CPU-intensive tasks like auth-sync and page rendering.
    const timer = setTimeout(setupFCM, 3000);
    return () => clearTimeout(timer);
  }, [user, authLoading, db, toast]);

  return null;
}
