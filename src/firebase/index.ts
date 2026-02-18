'use client';

import { auth, firestore } from './config';
import app from './config';

/**
 * Initializes the Firebase instances for the client.
 * This function is used by the FirebaseClientProvider.
 */
export async function initializeFirebase() {
  return {
    firebase: app,
    firestore,
    auth,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export { app, auth, firestore };
