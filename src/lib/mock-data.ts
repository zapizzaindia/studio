
import { City, Category, MenuItem, Outlet, UserProfile, Order, Banner, Coupon } from './types';
import { Timestamp } from 'firebase/firestore';

export const MOCK_CITIES: City[] = [
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'bangalore', name: 'Bangalore' },
  { id: 'delhi', name: 'Delhi' },
];

export const MOCK_OUTLETS: Outlet[] = [
  { id: 'andheri-zapizza', name: 'Zapizza Andheri West', cityId: 'mumbai', isOpen: true, openingTime: '11:00', closingTime: '23:00', brand: 'zapizza' },
  { id: 'andheri-zfry', name: 'Zfry Andheri West', cityId: 'mumbai', isOpen: true, openingTime: '11:00', closingTime: '23:00', brand: 'zfry' },
  { id: 'powai-zapizza', name: 'Zapizza Powai', cityId: 'mumbai', isOpen: true, openingTime: '10:00', closingTime: '22:00', brand: 'zapizza' },
  { id: 'indiranagar-zapizza', name: 'Zapizza Indiranagar', cityId: 'bangalore', isOpen: true, openingTime: '11:00', closingTime: '23:00', brand: 'zapizza' },
  { id: 'indiranagar-zfry', name: 'Zfry Indiranagar', cityId: 'bangalore', isOpen: true, openingTime: '11:00', closingTime: '23:00', brand: 'zfry' },
];

export const MOCK_CATEGORIES: Category[] = [
  // Zapizza Categories
  { id: 'veg-pizzas', name: 'Veg Pizzas', imageId: 'cat_veg', order: 1, brand: 'zapizza' },
  { id: 'non-veg-pizzas', name: 'Non-Veg Pizzas', imageId: 'cat_nonveg', order: 2, brand: 'zapizza' },
  { id: 'beverages-pizza', name: 'Beverages', imageId: 'cat_beverages', order: 3, brand: 'zapizza' },
  // Zfry Categories
  { id: 'fried-chicken', name: 'Crispy Chicken', imageId: 'cat_nonveg', order: 1, brand: 'zfry' },
  { id: 'burgers', name: 'Burgers & Wraps', imageId: 'cat_nonveg', order: 2, brand: 'zfry' },
  { id: 'beverages-fry', name: 'Beverages', imageId: 'cat_beverages', order: 3, brand: 'zfry' },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Zapizza Items
  {
    id: 'margherita',
    name: 'Classic Margherita',
    description: 'Simple and fresh with mozzarella, tomato sauce, and basil.',
    price: 249,
    isVeg: true,
    category: 'veg-pizzas',
    imageId: 'margherita',
    isAvailable: true,
    isAvailableGlobally: true,
    brand: 'zapizza',
    variations: [
      { name: 'Regular', price: 249 },
      { name: 'Medium', price: 449 }
    ]
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni Feast',
    description: 'Classic pepperoni with extra mozzarella and spicy sauce.',
    price: 499,
    isVeg: false,
    category: 'non-veg-pizzas',
    imageId: 'pepperoni',
    isAvailable: true,
    isAvailableGlobally: true,
    brand: 'zapizza'
  },
  // Zfry Items
  {
    id: 'zfry-bucket',
    name: 'Spicy Fry Bucket',
    description: '8 pieces of our secret spice crispy fried chicken.',
    price: 599,
    isVeg: false,
    category: 'fried-chicken',
    imageId: 'cat_nonveg',
    isAvailable: true,
    isAvailableGlobally: true,
    brand: 'zfry'
  },
  {
    id: 'zfry-burger',
    name: 'Z-Max Burger',
    description: 'Double patty chicken burger with molten cheese.',
    price: 199,
    isVeg: false,
    category: 'burgers',
    imageId: 'cat_nonveg',
    isAvailable: true,
    isAvailableGlobally: true,
    brand: 'zfry'
  },
  {
    id: 'coke',
    name: 'Coke (500ml)',
    description: 'Refreshing Coca-Cola.',
    price: 60,
    isVeg: true,
    category: 'beverages-pizza',
    imageId: 'coke',
    isAvailable: true,
    isAvailableGlobally: true,
    brand: 'zapizza'
  },
  {
    id: 'coke-fry',
    name: 'Coke (500ml)',
    description: 'Refreshing Coca-Cola.',
    price: 60,
    isVeg: true,
    category: 'beverages-fry',
    imageId: 'coke',
    isAvailable: true,
    isAvailableGlobally: true,
    brand: 'zfry'
  }
];

export const MOCK_BANNERS: Banner[] = [
  { id: 'banner_1', title: 'CHEESE LAVA PULL APART', subtitle: 'Freshly Launched!', price: '399', imageId: 'banner_1', active: true, brand: 'zapizza' },
  { id: 'banner_zfry', title: 'CRISPY CHICKEN BUCKET', subtitle: 'Weekender Special!', price: '599', imageId: 'banner_2', active: true, brand: 'zfry' },
];

export const MOCK_COUPONS: Coupon[] = [
  { id: 'cpn-1', code: 'ZAPIZZA50', discountType: 'percentage', discountValue: 50, minOrderAmount: 500, active: true, description: '50% Off on orders above ₹500' },
  { id: 'cpn-zfry', code: 'ZFRY20', discountType: 'percentage', discountValue: 20, minOrderAmount: 0, active: true, description: '20% Off on Zfry orders' },
];

export const MOCK_USERS: Record<string, UserProfile> = {
  'customer-1': { uid: 'customer-1', email: 'user@example.com', displayName: 'John Doe', role: 'customer' },
  'admin-zapizza': { uid: 'admin-zapizza', email: 'admin@zapizza.com', displayName: 'Zapizza Manager', role: 'outlet-admin', outletId: 'andheri-zapizza' },
  'admin-zfry': { uid: 'admin-zfry', email: 'admin@zfry.com', displayName: 'Zfry Manager', role: 'outlet-admin', outletId: 'andheri-zfry' },
  'franchise-1': { uid: 'franchise-1', email: 'franchise@zapizza.com', displayName: 'Zapizza Owner', role: 'franchise-owner' }
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-101',
    customerId: 'customer-1',
    customerName: 'John Doe',
    customerPhone: '+91-9876543210',
    items: [{ menuItemId: 'margherita', name: 'Classic Margherita', quantity: 1, price: 249, variation: 'Regular' }],
    total: 249,
    subtotal: 249,
    gst: 44.82,
    deliveryFee: 40,
    discount: 0,
    status: 'New',
    createdAt: Timestamp.now(),
    outletId: 'andheri-zapizza',
    deliveryAddress: {
      label: 'Home',
      flatNo: 'A-101',
      area: 'Andheri West',
      city: 'Mumbai',
      latitude: 19.1136,
      longitude: 72.8697
    }
  }
];
