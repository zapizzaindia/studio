
'use client';

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './config';

// VAPID key from Firebase Console
const VAPID_KEY = "BDs-DwZsERc8ry_rgUfTn_P6kQJeu-6P6GHFUkJGbAFGnNaoi0wAnbSoO89D9XOhPIOmuubhqHruzZ6lX3cxIYo";

/**
 * Requests notification permission and returns an FCM token.
 * Triggers the browser's native permission prompt if not already granted.
 */
export const requestForToken = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser environment.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied by user.');
      return null;
    }

    // Ensure the service worker is registered and ready before getting token
    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('FCM Token generated successfully:', currentToken);
      return currentToken;
    } else {
      console.warn('No registration token available. Check VAPID key.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving FCM token:', err);
    return null;
  }
};

export const onMessageListener = (messaging: Messaging) =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
