
'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!user || !db) return;

    const setupFCM = async () => {
      try {
        const isNative = typeof window !== "undefined" && !!(window as any).Capacitor;

        if (isNative) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          const syncNativeToken = (token: any) => {
            setDoc(doc(db, 'users', user.uid), {
              fcmToken: token.value,
              lastTokenSync: new Date().toISOString()
            }, { merge: true });
          };

          PushNotifications.addListener('registration', syncNativeToken);
          
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            toast({
              title: notification.title || "Alert",
              description: notification.body,
            });
          });

          // Re-trigger registration to ensure we have the token
          await PushNotifications.register();

        } else {
          // Web Flow
          if ('Notification' in window && Notification.permission === 'granted') {
            const token = await requestForToken();
            if (token) {
              await setDoc(doc(db, 'users', user.uid), {
                fcmToken: token,
                lastTokenSync: new Date().toISOString()
              }, { merge: true });
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
        console.warn("FCM Handler Error:", e);
      }
    };

    setupFCM();
  }, [user, db, toast]);

  return null;
}
