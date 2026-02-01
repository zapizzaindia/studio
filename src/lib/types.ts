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
