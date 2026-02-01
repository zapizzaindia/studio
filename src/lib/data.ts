import type { City, Category, MenuItem } from './types';

export const CITIES: City[] = [
  { id: 'nyc', name: 'New York' },
  { id: 'la', name: 'Los Angeles' },
  { id: 'chicago', name: 'Chicago' },
  { id: 'houston', name: 'Houston' },
  { id: 'phoenix', name: 'Phoenix' },
  { id: 'philly', name: 'Philadelphia' },
  { id: 'san_antonio', name: 'San Antonio' },
  { id: 'san_diego', name: 'San Diego' },
  { id: 'dallas', name: 'Dallas' },
  { id: 'san_jose', name: 'San Jose' },
];

export const CATEGORIES: Category[] = [
    { id: 'veg_pizzas', name: 'Veg Pizzas' },
    { id: 'non_veg_pizzas', name: 'Non-Veg Pizzas' },
    { id: 'sides', name: 'Sides' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'desserts', name: 'Desserts' },
];

export const MENU_ITEMS: MenuItem[] = [
    { id: 'm-01', name: 'Margherita', description: 'Classic delight with 100% real mozzarella cheese', price: 299, isVeg: true, category: 'veg_pizzas', imageId: 'margherita' },
    { id: 'v-01', name: 'Veggie Paradise', description: 'The awesome foursome! Golden corn, black olives, capsicum, red paprika', price: 449, isVeg: true, category: 'veg_pizzas', imageId: 'veggie_delight' },
    { id: 'v-02', name: 'Paneer Perfection', description: 'Flavorful trio of juicy paneer, crisp capsicum with spicy red paprika', price: 499, isVeg: true, category: 'veg_pizzas', imageId: 'veggie_delight' },
    { id: 'nv-01', name: 'Pepperoni', description: 'A classic American taste! Relish the delectable flavor of pepperoni', price: 549, isVeg: false, category: 'non_veg_pizzas', imageId: 'pepperoni' },
    { id: 'nv-02', name: 'Chicken Supreme', description: 'Loaded with delicious chicken, onion, and capsicum', price: 599, isVeg: false, category: 'non_veg_pizzas', imageId: 'supreme' },
    { id: 'nv-03', name: 'BBQ Chicken', description: 'Smoky BBQ chicken with a touch of sweetness', price: 579, isVeg: false, category: 'non_veg_pizzas', imageId: 'bbq_chicken' },
    { id: 's-01', name: 'Garlic Breadsticks', description: 'The perfect side to your pizza!', price: 129, isVeg: true, category: 'sides', imageId: 'garlic_bread' },
    { id: 's-02', name: 'Cheesy Dip', description: 'A dreamy, creamy dip to add that extra oomph to your meal.', price: 30, isVeg: true, category: 'sides', imageId: 'garlic_bread' },
    { id: 'b-01', name: 'Coke (500ml)', description: 'The perfect companion for your pizza.', price: 60, isVeg: true, category: 'beverages', imageId: 'coke' },
    { id: 'b-02', name: 'Pepsi (500ml)', description: 'The perfect companion for your pizza.', price: 60, isVeg: true, category: 'beverages', imageId: 'pepsi' },
    { id: 'd-01', name: 'Choco Lava Cake', description: 'Chocolate lovers delight! Indulgent, gooey, molten chocolate lava cake', price: 109, isVeg: true, category: 'desserts', imageId: 'choco_lava_cake' }
];

export const placeholderImages = {
  margherita: { url: 'https://picsum.photos/seed/margherita/600/400', hint: 'margherita pizza' },
  pepperoni: { url: 'https://picsum.photos/seed/pepperoni/600/400', hint: 'pepperoni pizza' },
  veggie_delight: { url: 'https://picsum.photos/seed/veggie/600/400', hint: 'vegetarian pizza' },
  supreme: { url: 'https://picsum.photos/seed/supreme/600/400', hint: 'supreme pizza' },
  bbq_chicken: { url: 'https://picsum.photos/seed/bbqchicken/600/400', hint: 'bbq pizza' },
  coke: { url: 'https://picsum.photos/seed/coke/400/400', hint: 'coke can' },
  pepsi: { url: 'https://picsum.photos/seed/pepsi/400/400', hint: 'pepsi can' },
  garlic_bread: { url: 'https://picsum.photos/seed/garlicbread/600/400', hint: 'garlic bread' },
  choco_lava_cake: { url: 'https://picsum.photos/seed/chococake/600/400', hint: 'chocolate cake' }
};
