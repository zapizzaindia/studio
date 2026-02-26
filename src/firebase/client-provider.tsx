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

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [firebaseInstances, setFirebaseInstances] =
  useState<FirebaseContextType>({
    firebase: undefined as any,
    firestore: undefined as any,
    auth: undefined as any,
  });

  useEffect(() => {
    const init = async () => {
      const { firebase, firestore, auth } = await initializeFirebase();
      setFirebaseInstances({ firebase, firestore, auth });
    };

    init();
  }, []);

  if (!firebaseInstances.firebase) {
    return null; // Or a loading spinner
  }

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
