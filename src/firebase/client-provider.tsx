'use client';
import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';
import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { enableIndexedDbPersistence } from "firebase/firestore";

interface FirebaseContextType {
  firebase?: FirebaseApp;
  firestore?: Firestore;
  auth?: Auth;
}

export const FirebaseClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [firebaseInstances, setFirebaseInstances] =
  useState<FirebaseContextType>({
    firebase: undefined,
    firestore: undefined,
    auth: undefined,
  });

  useEffect(() => {
    const init = async () => {
      const { firebase, firestore, auth } = await initializeFirebase();
      
      // Configure auth persistence inside the hook context
      if (auth) {
        setPersistence(auth, browserLocalPersistence).catch(console.error);
      }

      // Enable offline persistence for Firestore
      if (firestore) {
        enableIndexedDbPersistence(firestore).catch((err) => {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a a time.
            console.warn('Firestore persistence failed: Multiple tabs');
          } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('Firestore persistence failed: Not supported');
          }
        });
      }
      
      setFirebaseInstances({ firebase, firestore, auth });
    };

    init();
  }, []);

  // Hydration safety: 
  // We avoid returning 'null' here. Instead, we render the children immediately.
  // The hooks (useUser, useDoc, etc.) are already built to handle 'null' or 'loading' states
  // until the firebaseInstances are populated via the effect.
  return (
    <FirebaseProvider
      firebase={firebaseInstances.firebase}
      firestore={firebaseInstances.firestore}
      auth={firebaseInstances.auth}
    >
      {children}
    </FirebaseProvider>
  );
};
