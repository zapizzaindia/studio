
import { City, Category, MenuItem, Outlet, UserProfile, Order, Banner, Coupon } from './types';
import { Timestamp } from 'firebase/firestore';

export const MOCK_CITIES: City[] = [
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'bangalore', name: 'Bangalore' },
  { id: 'delhi', name: 'Delhi' },
];

export const MOCK_OUTLETS: Outlet[] = [
  { id: 'andheri', name: 'Zapizza Andheri West', cityId: 'mumbai', isOpen: true, openingTime: '11:00', closingTime: '23:00' },
  { id: 'powai', name: 'Zapizza Powai', cityId: 'mumbai', isOpen: true, openingTime: '10:00', closingTime: '22:00' },
  { id: 'indiranagar', name: 'Zapizza Indiranagar', cityId: 'bangalore', isOpen: true, openingTime: '11:00', closingTime: '23:00' },
  { id: 'koramangala', name: 'Zapizza Koramangala', cityId: 'bangalore', isOpen: false, openingTime: '11:00', closingTime: '23:00' },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'veg-pizzas', name: 'Veg Pizzas', imageId: 'cat_veg', order: 1 },
  { id: 'non-veg-pizzas', name: 'Non-Veg Pizzas', imageId: 'cat_nonveg', order: 2 },
  { id: 'beverages', name: 'Beverages', imageId: 'cat_beverages', order: 3 },
  { id: 'desserts', name: 'Desserts', imageId: 'cat_desserts', order: 4 },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
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
    variations: [
      { 
        name: 'Regular', 
        price: 249,
        addons: [
          { name: 'Extra Cheese (Reg)', price: 75 },
          { name: 'Fresh Basil', price: 20 }
        ]
      },
      { 
        name: 'Medium', 
        price: 449,
        addons: [
          { name: 'Double Cheese (Med)', price: 120 },
          { name: 'Olive Oil Drizzle', price: 40 }
        ]
      }
    ],
    addons: [
      { name: 'Extra Cheese', price: 75 },
      { name: 'Fresh Mushrooms', price: 50 }
    ],
    recommendedSides: ['coke', 'choco-lava']
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
    variations: [
      { 
        name: 'Medium', 
        price: 499,
        addons: [
          { name: 'Double Pepperoni', price: 120 },
          { name: 'Jalapenos', price: 45 }
        ]
      },
      { 
        name: 'Large', 
        price: 699,
        addons: [
          { name: 'Pepperoni Overload', price: 180 }
        ]
      }
    ]
  },
  {
    id: 'veggie-delight',
    name: 'Veggie Delight',
    description: 'Loaded with bell peppers, onions, mushrooms, and olives.',
    price: 349,
    isVeg: true,
    category: 'veg-pizzas',
    imageId: 'veggie_delight',
    isAvailable: true,
    isAvailableGlobally: true,
    addons: [
      { name: 'Extra Olives', price: 40 },
      { name: 'Paneer Cubes', price: 80 }
    ]
  },
  {
    id: 'coke',
    name: 'Coke (500ml)',
    description: 'Refreshing Coca-Cola.',
    price: 60,
    isVeg: true,
    category: 'beverages',
    imageId: 'coke',
    isAvailable: true,
    isAvailableGlobally: true
  },
  {
    id: 'choco-lava',
    name: 'Choco Lava Cake',
    description: 'Warm chocolate cake with a molten center.',
    price: 99,
    isVeg: true,
    category: 'desserts',
    imageId: 'choco_lava_cake',
    isAvailable: true,
    isAvailableGlobally: true
  }
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: 'banner_1',
    title: 'CHEESE LAVA PULL APART',
    subtitle: 'Freshly Launched!',
    price: '399',
    imageId: 'banner_1',
    active: true
  },
  {
    id: 'banner_2',
    title: 'ULTIMATE PIZZA PARTY',
    subtitle: 'Limited Time Offer!',
    price: '499',
    imageId: 'banner_2',
    active: true
  },
  {
    id: 'banner_3',
    title: 'LAVALICIOUS DESSERTS',
    subtitle: 'Sweeten Your Meal!',
    price: '99',
    imageId: 'banner_3',
    active: true
  },
];

export const MOCK_COUPONS: Coupon[] = [
  { 
    id: 'cpn-1', 
    code: 'ZAPIZZA50', 
    discountType: 'percentage', 
    discountValue: 50, 
    minOrderAmount: 500, 
    active: true,
    description: 'Get 50% Off on your order above ₹500. Valid Only on Regular, Medium and Large Pizza.'
  },
  { 
    id: 'cpn-2', 
    code: 'WELCOME100', 
    discountType: 'fixed', 
    discountValue: 100, 
    minOrderAmount: 300, 
    active: true,
    description: 'Flat ₹100 Off on your first order above ₹300. Welcome to the Zapizza family!'
  },
  { 
    id: 'cpn-3', 
    code: 'PIZZALOVE', 
    discountType: 'percentage', 
    discountValue: 20, 
    minOrderAmount: 0, 
    active: true,
    description: '20% Off on all orders. Because we love pizza as much as you do!'
  },
];

export const MOCK_USERS: Record<string, UserProfile> = {
  'customer-1': {
    uid: 'customer-1',
    email: 'user@example.com',
    displayName: 'John Doe',
    role: 'customer'
  },
  'admin-1': {
    uid: 'admin-1',
    email: 'admin@zapizza.com',
    displayName: 'Outlet Manager',
    role: 'outlet-admin',
    outletId: 'andheri'
  },
  'franchise-1': {
    uid: 'franchise-1',
    email: 'franchise@zapizza.com',
    displayName: 'Zapizza Owner',
    role: 'franchise-owner'
  }
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
    outletId: 'andheri',
    deliveryAddress: {
      label: 'Home',
      flatNo: 'A-101, Galaxy Apts',
      area: 'Andheri West',
      city: 'Mumbai',
      landmark: 'Near City Mall'
    }
  },
  {
    id: 'ord-102',
    customerId: 'customer-1',
    customerName: 'John Doe',
    customerPhone: '+91-9876543210',
    items: [{ 
      menuItemId: 'pepperoni', 
      name: 'Pepperoni Feast', 
      quantity: 2, 
      price: 499, 
      variation: 'Medium', 
      addons: ['Double Pepperoni', 'Jalapenos'] 
    }],
    total: 998,
    subtotal: 998,
    gst: 179.64,
    deliveryFee: 0,
    discount: 0,
    status: 'Completed',
    createdAt: Timestamp.now(),
    outletId: 'andheri',
    deliveryAddress: {
      label: 'Work',
      flatNo: 'Tech Hub, Level 4',
      area: 'Bandra Kurla Complex',
      city: 'Mumbai',
      landmark: 'ICICI Bank',
      latitude: 19.0760,
      longitude: 72.8777
    }
  }
];
