'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/firebase/config';
import { requestForToken } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

/**
 * FCMHandler - Manages background sync for Push Notifications.
 * Optimized for both PWA and Capacitor Native Android.
 */
export function FCMHandler() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Wait until user is authenticated and DB is ready
    if (!user || authLoading || !db || hasInitialized.current) return;

    const setupFCM = async () => {
      // Determine Profile ID: Admins use Email, Customers use UID.
      const isPasswordUser = user.providerData.some(p => p.providerId === 'password');
      const profileId = isPasswordUser ? user.email?.toLowerCase().trim() : user.uid;
      
      if (!profileId) return;

      try {
        const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;

        if (isNative) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          // 1. Attach background listeners
          await PushNotifications.addListener('registration', (token) => {
            console.log("Native Token Captured:", token.value);
            setDoc(doc(db, 'users', profileId), {
              fcmToken: token.value,
              lastTokenSync: new Date().toISOString()
            }, { merge: true }).catch(err => console.error("FCM Native Token Sync Error:", err));
          });

          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            toast({
              title: notification.title || "Zapizza Alert",
              description: notification.body,
            });
          });

          await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            const url = notification.notification.data?.url;
            if (url) window.location.href = url;
          });

          // 2. Request permission if not already checked
          const permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            hasInitialized.current = true;
          }
        } else {
          // Web/PWA Logic
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
      } catch (e) {
        console.warn("FCM Handler Silent Exception:", e);
      }
    };

    // Delay slightly to ensure browser/capacitor bridges are ready
    const timer = setTimeout(setupFCM, 3000);
    return () => clearTimeout(timer);
  }, [user, authLoading, db, toast]);

  return null;
}
