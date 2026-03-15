'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/firebase/config';
import { requestForToken } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

/**
 * FCMHandler - Handles token generation, foreground message listening,
 * and syncing the FCM token to the user's Firestore document.
 */
export function FCMHandler() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !db) return;

    const setupFCM = async () => {
      try {
        // 1. Check current permission
        if ('Notification' in window && Notification.permission === 'granted') {
          const token = await requestForToken();
          if (token) {
            // Silently sync token to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: token,
              lastTokenSync: new Date().toISOString()
            });
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
      } catch (e) {
        console.warn("FCM Setup failed silently:", e);
      }
    };

    // Register Service Worker and then setup FCM
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        .then((registration) => {
          console.log('FCM SW registered with scope:', registration.scope);
          setupFCM();
        })
        .catch((err) => {
          console.error('FCM SW registration failed:', err);
          // Fallback setup even without SW (foreground only)
          setupFCM();
        });
    } else {
      setupFCM();
    }
  }, [user, db, toast]);

  return null;
}
