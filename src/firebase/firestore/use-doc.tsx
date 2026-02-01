// src/firebase/firestore/use-doc.tsx
'use client';
import { doc, onSnapshot, DocumentReference, DocumentData, FirestoreError, DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { useFirestore } from '..';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface DocData<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
}

export function useDoc<T>(path: string, id: string): DocData<T> {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const docRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, path, id) as DocumentReference<DocumentData>;
  }, [firestore, path, id]);

  useEffect(() => {
    if (!docRef) return;

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Error fetching document:', err);
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
