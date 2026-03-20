'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/firebase/config';
import { requestForToken } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export function FCMHandler() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only attempt setup if we have a user and haven't initialized in this session cycle
    if (!user || !db || hasInitialized.current) return;

    const setupFCM = async () => {
      try {
        const isNative = typeof window !== "undefined" && !!(window as any).Capacitor;

        if (isNative) {
          // Dynamic import to avoid SSR/Web environment issues with native-only plugins
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          // Request permission and register for push notifications
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            const syncNativeToken = (token: any) => {
              setDoc(doc(db, 'users', user.uid), {
                fcmToken: token.value,
                lastTokenSync: new Date().toISOString()
              }, { merge: true }).catch(err => console.error("FCM Token Sync Error:", err));
            };

            PushNotifications.addListener('registration', syncNativeToken);
            
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              toast({
                title: notification.title || "Zapizza Update",
                description: notification.body,
              });
            });

            await PushNotifications.register();
            hasInitialized.current = true;
          }

        } else {
          // Web/PWA Flow
          if ('Notification' in window) {
            // We request token which internally handles Notification.requestPermission()
            const token = await requestForToken();
            if (token) {
              await setDoc(doc(db, 'users', user.uid), {
                fcmToken: token,
                lastTokenSync: new Date().toISOString()
              }, { merge: true });
              hasInitialized.current = true;
            }
          }

          const messaging = getMessaging(app);
          onMessage(messaging, (payload) => {
            toast({
              title: payload.notification?.title || "Notification",
              description: payload.notification?.body,
            });
          });
        }
      } catch (e) {
        console.warn("FCM Handler Exception (Non-Critical):", e);
      }
    };

    // Adding a small delay to ensure the UI transition from login is complete
    const timer = setTimeout(setupFCM, 2000);
    return () => clearTimeout(timer);
  }, [user, db, toast]);

  return null;
}
