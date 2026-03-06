
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
      // 1. Request Token
      const token = await requestForToken();
      if (token) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: token
          });
        } catch (e) {
          console.warn("Failed to sync FCM token", e);
        }
      }

      // 2. Setup Foreground Listener
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        console.log('Foreground Message received: ', payload);
        toast({
          title: payload.notification?.title || "Notification",
          description: payload.notification?.body,
        });
      });
    };

    // Register SW first for some browsers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('FCM SW registered:', registration.scope);
          setupFCM();
        })
        .catch((err) => {
          console.error('FCM SW registration failed:', err);
        });
    } else {
      setupFCM();
    }
  }, [user, db, toast]);

  return null;
}
