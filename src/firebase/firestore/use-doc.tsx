
'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '../provider';

interface DocData<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
}

export function useDoc<T>(path: string, id: string): DocData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !id || id === 'dummy') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const docRef = doc(firestore, path, id);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      }, (err) => {
        console.error(`Firestore useDoc error [${path}/${id}]:`, err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(`Firestore useDoc setup error [${path}/${id}]:`, err);
      setError(err);
      setLoading(false);
    }
  }, [firestore, path, id]);

  return { data, loading, error };
}
