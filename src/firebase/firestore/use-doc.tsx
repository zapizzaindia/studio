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

  // Reset loading state synchronously during render when ID changes
  // to prevent stale loading:false states from previous documents.
  const [lastId, setLastId] = useState(id);
  const [lastPath, setLastPath] = useState(path);

  if (id !== lastId || path !== lastPath) {
    setLastId(id);
    setLastPath(path);
    setLoading(true);
    setData(null);
    setError(null);
  }

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
