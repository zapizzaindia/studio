import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIkIO0RI3nfKPkcR33rDyqs_12TK4jw2M",
  authDomain: "zapizza-backend.firebaseapp.com",
  projectId: "zapizza-backend",
  storageBucket: "zapizza-backend.firebasestorage.app",
  messagingSenderId: "197006828213",
  appId: "1:197006828213:web:261179eeb89f86ce6b94fc",
  measurementId: "G-V1TMNB954N"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * 🔥 CAPACITOR ANDROID PERSISTENCE FIX
 * initializeAuth with indexedDBLocalPersistence is significantly more stable
 * than getAuth() in mobile WebViews, preventing random session loss.
 */
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
});

export const firestore = getFirestore(app);

export default app;
