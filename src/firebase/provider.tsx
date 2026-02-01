// src/firebase/provider.tsx
'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebase: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider: React.FC<{
  children: ReactNode;
  firebase?: FirebaseApp;
  firestore?: Firestore;
  auth?: Auth;
}> = ({ children, firebase, firestore, auth }) => {
  const contextValue = {
    firebase: firebase || null,
    firestore: firestore || null,
    auth: auth || null,
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp | null => {
    return useFirebase().firebase;
}

export const useFirestore = (): Firestore | null => {
    return useFirebase().firestore;
}

export const useAuth = (): Auth | null => {
    return useFirebase().auth;
}
