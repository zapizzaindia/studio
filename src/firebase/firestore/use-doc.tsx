
'use client';
import { useEffect, useState } from 'react';
import { 
  MOCK_CITIES, 
  MOCK_OUTLETS, 
  MOCK_MENU_ITEMS, 
  MOCK_USERS 
} from '@/lib/mock-data';

interface DocData<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
}

export function useDoc<T>(path: string, id: string): DocData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === 'dummy') {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const timer = setTimeout(() => {
      let result: any = null;

      if (path === 'cities') {
        result = MOCK_CITIES.find(c => c.id === id);
      } else if (path === 'outlets') {
        result = MOCK_OUTLETS.find(o => o.id === id);
      } else if (path === 'menuItems') {
        result = MOCK_MENU_ITEMS.find(m => m.id === id);
      } else if (path === 'users') {
        result = MOCK_USERS[id];
      }

      setData(result as T);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [path, id]);

  return { data, loading, error: null };
}
