import type { placeholderImages } from './data';

export type City = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  category: string;
  imageId: keyof typeof placeholderImages;
  isAvailable: boolean;
};

export type OrderStatus = 'New' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';

export type OrderItem = {
  menuItem: MenuItem;
  quantity: number;
};

export type Order = {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  outletId: string;
};

export type Outlet = {
    id: string;
    name: string;
    cityId: string;
    isOpen: boolean;
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'franchise-owner' | 'outlet-admin';
    outletId?: string;
};
