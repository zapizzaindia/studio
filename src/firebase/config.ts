import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSu9BNIBegwN654IxpxaqYxL79O28fcPM",
  authDomain: "zapizza-backend.firebaseapp.com",
  projectId: "zapizza-backend",
  storageBucket: "zapizza-backend.appspot.com",
  messagingSenderId: "869168144766",
  appId: "1:869168144766:web:be17174874980971e5d32f",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
