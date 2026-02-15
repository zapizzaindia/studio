
import type { Timestamp } from 'firebase/firestore';

export type City = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
};

export type MenuItemVariation = {
  name: string;
  price: number;
};

export type MenuItemAddon = {
  name: string;
  price: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  category: string;
  imageId: string;
  isAvailable: boolean;
  isAvailableGlobally: boolean;
  variations?: MenuItemVariation[];
  addons?: MenuItemAddon[];
  recommendedSides?: string[];
};

export type GlobalSettings = {
  gstPercentage: number;
  deliveryFee: number;
  minOrderForFreeDelivery: number;
  loyaltyRatio: number; // points per 100 INR spent
};

export type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
  description?: string;
};

export type OrderStatus = 'New' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';

export type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
  outletId: string;
};

export type Outlet = {
    id: string;
    name: string;
    cityId: string;
    isOpen: boolean;
    openingTime: string;
    closingTime: string;
};

export type UserProfile = {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: 'customer' | 'outlet-admin' | 'franchise-owner';
    outletId?: string;
    loyaltyPoints?: number;
};

export type Address = {
    id: string;
    label: 'Home' | 'Work' | 'Other';
    flatNo: string;
    area: string;
    landmark?: string;
    city: string;
    isDefault: boolean;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  imageId: string;
  active: boolean;
};
