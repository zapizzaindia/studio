import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { 
   
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
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

export const auth = getAuth(app);
// 🔥 FORCE PERSISTENCE (CRITICAL FIX)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Auth persistence set to LOCAL");
  })
  .catch((err) => {
    console.error("❌ Persistence error:", err);
  });
export const firestore = getFirestore(app);

export default app;