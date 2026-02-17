
'use client';
import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  QueryConstraint,
  WhereFilterOp
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface CollectionData<T> {
  data: T[] | null;
  loading: boolean;
  error: any | null;
}

export function useCollection<T>(
  path: string,
  options?: {
    where?: [string, WhereFilterOp, any];
  }
): CollectionData<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    
    const constraints: QueryConstraint[] = [];
    if (options?.where) {
      const [field, op, value] = options.where;
      if (value !== undefined && value !== 'dummy') {
        constraints.push(where(field, op, value));
      }
    }

    try {
      const q = query(collection(firestore, path), ...constraints);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(docs);
        setLoading(false);
      }, (err) => {
        console.error(`Firestore useCollection error [${path}]:`, err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(`Firestore useCollection setup error [${path}]:`, err);
      setError(err);
      setLoading(false);
    }
  }, [firestore, path, JSON.stringify(options?.where)]);

  return { data, loading, error };
}
