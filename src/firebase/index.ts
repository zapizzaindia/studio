'use client';

import app, { auth, firestore } from './config';
import { getFirestore } from "firebase/firestore";

/**
 * Initializes the Firebase instances for the client.
 */
export async function initializeFirebase() {
  return {
    firebase: app,
    firestore,
    auth,
  };
}

// ✅ Export db (THIS FIXES YOUR ORIGINAL ERROR)
export const db = getFirestore(app);

// existing exports
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';

// named exports
export { app, auth, firestore };