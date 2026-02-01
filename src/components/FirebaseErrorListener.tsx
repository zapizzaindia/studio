// src/components/FirebaseErrorListener.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * This is a client component that listens for custom 'permission-error'
 * events and throws them as an uncaught exception. In Next.js's development
 * mode, this will display the error in an overlay. In production, this will
 * trigger the nearest error.js boundary.
 *
 * The primary use case is to surface rich, actionable Firestore security rule
 * permission errors to the developer during development.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (error: Error) => {
      setError(error);
    };
    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, []);

  if (error) {
    // Throwing the error here will be caught by Next.js's error boundary
    // and displayed in the dev overlay.
    throw error;
  }

  return null;
}
