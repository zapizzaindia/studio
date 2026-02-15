'use client';
import { useEffect, useState } from 'react';
import { 
  MOCK_CITIES, 
  MOCK_OUTLETS, 
  MOCK_CATEGORIES, 
  MOCK_MENU_ITEMS, 
  MOCK_ORDERS,
  MOCK_BANNERS,
  MOCK_COUPONS
} from '@/lib/mock-data';

interface CollectionData<T> {
  data: T[] | null;
  loading: boolean;
  error: any | null;
}

export function useCollection<T>(
  path: string,
  options?: {
    where?: [string, '==', any];
  }
): CollectionData<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Simulate network delay
    const timer = setTimeout(() => {
      let result: any[] = [];

      if (path.includes('cities')) {
        result = MOCK_CITIES;
      } else if (path.includes('outlets') && path.includes('menuAvailability')) {
        // Mock availability - everything is available in demo
        result = MOCK_MENU_ITEMS.map(item => ({ id: item.id, isAvailable: true }));
      } else if (path.includes('outlets')) {
        result = MOCK_OUTLETS;
      } else if (path.includes('categories')) {
        result = MOCK_CATEGORIES;
      } else if (path.includes('menuItems')) {
        result = MOCK_MENU_ITEMS;
      } else if (path.includes('orders')) {
        result = MOCK_ORDERS;
      } else if (path.includes('banners')) {
        result = MOCK_BANNERS;
      } else if (path.includes('coupons')) {
        result = MOCK_COUPONS;
      } else if (path.includes('users')) {
        // This is a rough mock for users collection
        result = [
          { uid: 'customer-1', email: 'user@example.com', displayName: 'John Doe', role: 'customer' },
          { uid: 'admin-1', email: 'admin@zapizza.com', displayName: 'Outlet Manager', role: 'outlet-admin', outletId: 'andheri' },
          { uid: 'franchise-1', email: 'franchise@zapizza.com', displayName: 'Zapizza Owner', role: 'franchise-owner' }
        ];
      }

      // Apply simple client-side filter for demo
      if (options?.where) {
        const [field, op, value] = options.where;
        if (value !== undefined) {
           result = result.filter(item => item[field] === value);
        }
      }

      setData(result as T[]);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [path, JSON.stringify(options?.where)]);

  return { data, loading, error: null };
}
