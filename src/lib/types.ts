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
