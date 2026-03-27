
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
 * Automatically triggers the native system permission popup on Android/iOS when the app starts.
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
          
          // Trigger the standard native system permission popup
          // On Android 13+, this will show the "Allow Notifications" dialog.
          let permStatus = await PushNotifications.requestPermissions();

          if (permStatus.receive === 'granted') {
            // Clean up old listeners to prevent duplicates on hot-reloads
            await PushNotifications.removeAllListeners();

            // Handle token registration
            await PushNotifications.addListener('registration', (token) => {
              setDoc(doc(db, 'users', profileId), {
                fcmToken: token.value,
                lastTokenSync: new Date().toISOString()
              }, { merge: true }).catch(err => console.error("FCM Native Token Sync Error:", err));
            });

            // Handle incoming notifications while app is in foreground
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
              toast({
                title: notification.title || "Zapizza Alert",
                description: notification.body,
              });
            });

            // Handle clicks on notifications (e.g. open the order list)
            await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
              const url = notification.notification.data?.url;
              if (url) {
                window.location.href = url;
              }
            });

            // Initiate device registration with FCM
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
        console.warn("FCM System Exception:", e);
      }
    };

    // Execute setup with a short delay to ensure hardware bridge is ready
    const timer = setTimeout(setupFCM, 1500);
    return () => clearTimeout(timer);
  }, [user, authLoading, db, toast]);

  return null;
}
