
import type { Timestamp } from 'firebase/firestore';

export type Brand = 'zapizza' | 'zfry';

export type City = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export type Category = {
  id: string;
  name: string;
  imageId?: string;
  order?: number;
  brand: Brand;
};

export type MenuItemVariation = {
  name: string;
  price: number;
  addons?: MenuItemAddon[];
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
  brand: Brand;
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
  maxDiscountAmount?: number; // Capping logic
  active: boolean;
  description?: string;
  brand: Brand;
};

export type OrderStatus = 'New' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';

export type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variation?: string;
  addons?: string[];
};

export type DeliveryAddress = {
  label: string;
  flatNo: string;
  area: string;
  landmark?: string;
  city: string;
  latitude?: number;
  longitude?: number;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  specialNote?: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
  outletId: string;
  deliveryAddress: DeliveryAddress;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentId?: string;
  cancellationReason?: string;
  loyaltyPointsEarned?: number;
};

export type Outlet = {
    id: string;
    name: string;
    cityId: string;
    isOpen: boolean;
    openingTime: string;
    closingTime: string;
    brand: Brand;
    address?: string;
    deliveryTime?: string;
    rating?: number;
    reviewCount?: number;
    latitude?: number;
    longitude?: number;
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
};

export type UserProfile = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    role: 'customer' | 'outlet-admin' | 'franchise-owner';
    outletId?: string;
    loyaltyPoints?: number;
    phoneNumber?: string;
    birthday?: string;
};

export type Address = {
    id: string;
    label: 'Home' | 'Work' | 'Other';
    flatNo: string;
    area: string;
    landmark?: string;
    city: string;
    isDefault: boolean;
    latitude?: number;
    longitude?: number;
};

export type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  price?: string;
  imageId: string;
  active: boolean;
  brand: Brand;
  isHero?: boolean;
  mediaType?: 'image' | 'video';
};

export type OutletMenuAvailability = {
  id: string; // matches menuItemId
  isAvailable: boolean;
};
