'use server'

import admin from "firebase-admin"

/**
 * Server Action to broadcast push notifications via FCM.
 * Requires FIREBASE_ADMIN_KEY environment variable.
 */
const serviceAccountKey = process.env.FIREBASE_ADMIN_KEY;

if (!admin.apps.length && serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error("FCM Admin Init Error:", err);
  }
}

export async function broadcastPushNotification(payload: {
  title: string
  body: string
  imageUrl?: string
  deepLink?: string
  tokens: string[]
}) {
  if (!payload.tokens || payload.tokens.length === 0) {
    return { success: false, message: "No recipient tokens provided." }
  }

  if (!admin.apps.length) {
    return { success: false, message: "Firebase Admin not initialized. Check server environment." }
  }

  try {
    console.log(`Broadcasting push to ${payload.tokens.length} devices...`);
  
    const response = await admin.messaging().sendEachForMulticast({
      tokens: payload.tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {})
      },
      data: {
        url: payload.deepLink || "/home",
        // Supporting background handling
        click_action: "FLUTTER_NOTIFICATION_CLICK" 
      },
      android: {
        notification: {
          icon: 'stock_ticker_update',
          color: '#14532d'
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        }
      }
    });
  
    console.log("FCM Multicast response:", response);
  
    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      message: `Successfully delivered to ${response.successCount} devices.`
    }
  
  } catch (err: any) {
    console.error("FCM SERVER ERROR:", err);
    return { success: false, message: err.message || "Unknown error occurred during broadcast." }
  }
}
