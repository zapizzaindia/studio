
// This script runs in the background even when the app is closed.
// It is required for Firebase Cloud Messaging to work on the web.

importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// Must match the config in src/firebase/config.ts
firebase.initializeApp({
  apiKey: "AIzaSyDIkIO0RI3nfKPkcR33rDyqs_12TK4jw2M",
  authDomain: "zapizza-backend.firebaseapp.com",
  projectId: "zapizza-backend",
  storageBucket: "zapizza-backend.firebasestorage.app",
  messagingSenderId: "197006828213",
  appId: "1:197006828213:web:261179eeb89f86ce6b94fc",
  measurementId: "G-V1TMNB954N"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || "Zapizza Update";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon-192.png',
    data: {
        url: payload.data?.url || '/home'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
