
'use client';

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './config';

// NOTE: Replace with your actual VAPID key from Firebase Console
// Project Settings -> Cloud Messaging -> Web Configuration -> Web Push certificates
const VAPID_KEY = "REPLACE_WITH_YOUR_ACTUAL_VAPID_KEY";

export const requestForToken = async () => {
  try {
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log('FCM Token generated:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (messaging: Messaging) =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
