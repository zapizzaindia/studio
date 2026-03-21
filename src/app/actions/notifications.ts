
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

/**
 * Specifically notifies admins of an outlet when a new order arrives.
 * This is designed to wake up minimized/closed devices.
 */
export async function notifyAdminsOfOrder(payload: {
  orderId: string
  outletId: string
  customerName: string
  total: number
}) {
  if (!admin.apps.length) {
    return { success: false, message: "Firebase Admin not initialized." }
  }

  try {
    const db = admin.firestore();
    
    // Find admins for this specific outlet
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'outlet-admin')
      .where('outletId', '==', payload.outletId)
      .get();

    const tokens: string[] = [];
    adminsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) tokens.push(data.fcmToken);
    });

    if (tokens.length === 0) {
      return { success: false, message: "No admins found with active device tokens." }
    }

    console.log(`Sending new order alert to ${tokens.length} admins...`);

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "🚨 NEW ORDER RECEIVED!",
        body: `${payload.customerName} just ordered for ₹${payload.total.toFixed(0)}`,
      },
      data: {
        orderId: payload.orderId,
        url: "/admin/dashboard/orders",
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'order_alarm', // Matches res/raw/order_alarm.mp3
          channelId: 'orders', // Matches high-priority notification channel
          icon: 'stock_ticker_update',
          color: '#14532d',
          tag: 'new_order',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'order_alarm.wav',
            badge: 1,
            contentAvailable: true
          }
        }
      }
    });

    return { 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    };

  } catch (err: any) {
    console.error("ADMIN NOTIFY ERROR:", err);
    return { success: false, message: err.message };
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
