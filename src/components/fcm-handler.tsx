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
 * It waits for a stable session before requesting permissions.
 */
export function FCMHandler() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!user || authLoading || !db || hasInitialized.current) return;

    const setupFCM = async () => {
      // Logic to determine profile ID:
      // Customers (Phone Login) use UID as document ID.
      // Admins (Email Login) use Email as document ID.
      const isPasswordUser = user.providerData.some(p => p.providerId === 'password');
      const profileId = isPasswordUser ? user.email?.toLowerCase().trim() : user.uid;
      
      if (!profileId) return;

      try {
        const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;

        if (isNative) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            // Register listener for token generation
            await PushNotifications.addListener('registration', (token) => {
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

            await PushNotifications.addListener(
              'pushNotificationActionPerformed',
              (notification) => {
                const url = notification.notification.data?.url;
                if (url) {
                  window.location.href = url;
                }
              }
            );

            await PushNotifications.register();
            hasInitialized.current = true;
          }

        } else {
          // Web/PWA Standard Flow
          if (typeof window !== 'undefined' && 'Notification' in window) {
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
        console.warn("FCM Handler Exception:", e);
      }
    };

    const timer = setTimeout(setupFCM, 3000);
    return () => clearTimeout(timer);
  }, [user, authLoading, db, toast]);

  return null;
}
