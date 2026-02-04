// src/firebase/index.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "./config";

/**
 * Initializes Firebase services.
 * This is used by the FirebaseClientProvider to set up the app.
 */
export async function initializeFirebase() {
  const firebase = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(firebase);
  const firestore = getFirestore(firebase);
  return { firebase, firestore, auth };
}

// Static instances for direct usage where hooks aren't applicable
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Barrel exports for the rest of the application
export { 
  FirebaseProvider, 
  useFirebase, 
  useFirebaseApp, 
  useFirestore, 
  useAuth 
} from './provider';

export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
