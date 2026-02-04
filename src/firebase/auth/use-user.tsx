
'use client';
import { useEffect, useState } from 'react';

export const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for a "mock session"
    const mockSession = localStorage.getItem('zapizza-mock-session');
    if (mockSession) {
      setUser(JSON.parse(mockSession));
    }
    setLoading(false);
  }, []);

  return { user, loading };
};
