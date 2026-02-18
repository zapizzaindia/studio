
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

export const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    if (!auth) {
      // If Firebase Auth isn't initialized yet, check for mock session immediately
      const mockSession = localStorage.getItem('zapizza-mock-session');
      if (mockSession) {
        setUser(JSON.parse(mockSession));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // We have a real Firebase user
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // No real user, fallback to check for mock session (Demo Mode)
        const mockSession = localStorage.getItem('zapizza-mock-session');
        if (mockSession) {
          setUser(JSON.parse(mockSession));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
};
