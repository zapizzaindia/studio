// src/firebase/firestore/use-collection.tsx
'use client';
import {
  collection,
  onSnapshot,
  query,
  where,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { useFirestore } from '..';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface CollectionData<T> {
  data: T[] | null;
  loading: boolean;
  error: FirestoreError | null;
}

export function useCollection<T>(
  path: string,
  options?: {
    where?: [string, '==', any];
  }
): CollectionData<T> {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const collectionQuery = useMemo(() => {
    if (!firestore) return null;
    let q: Query<DocumentData> = collection(firestore, path);
    if (options?.where) {
      q = query(q, where(...options.where));
    }
    return q;
  }, [firestore, path, options?.where]);

  useEffect(() => {
    if (!collectionQuery) return;

    const unsubscribe = onSnapshot(
      collectionQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(documents);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Error fetching collection:', err);
        const permissionError = new FirestorePermissionError({
          path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionQuery, path]);

  return { data, loading, error };
}
