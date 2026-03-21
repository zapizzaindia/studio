'use client';
import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';
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
      
      // Auth persistence is now handled during initialization in config.ts
      // using indexedDBLocalPersistence for high reliability on Capacitor Android.

      // Enable offline persistence for Firestore
      if (firestore) {
        enableIndexedDbPersistence(firestore).catch((err) => {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
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
