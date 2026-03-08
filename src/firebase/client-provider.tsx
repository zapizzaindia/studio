'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';

interface FirebaseContextType {
  firebase?: FirebaseApp;
  firestore?: Firestore;
  auth?: Auth;
}
import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "./config";

useEffect(() => {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}, []);

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
