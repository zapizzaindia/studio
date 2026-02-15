'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, MenuItemVariation, MenuItemAddon } from '@/lib/types';

export interface CartItem extends MenuItem {
  cartId: string; // Unique ID for this specific configuration
  selectedVariation?: MenuItemVariation;
  selectedAddons?: MenuItemAddon[];
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, variation?: MenuItemVariation, addons?: MenuItemAddon[]) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('zapizza-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zapizza-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: MenuItem, variation?: MenuItemVariation, addons: MenuItemAddon[] = []) => {
    // Generate a unique ID for this specific configuration (Item + Variation + Addons)
    const variationKey = variation?.name || 'base';
    const addonsKey = addons.map(a => a.name).sort().join('|') || 'none';
    const cartId = `${item.id}-${variationKey}-${addonsKey}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.cartId === cartId);
      if (existing) {
        return prev.map((i) =>
          i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      
      // Calculate specific price for this item
      const basePrice = variation ? variation.price : item.price;
      const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
      const finalPrice = basePrice + addonsTotal;

      return [...prev, { 
        ...item, 
        cartId, 
        price: finalPrice, 
        selectedVariation: variation, 
        selectedAddons: addons, 
        quantity: 1 
      }];
    });
  };

  const removeItem = (cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.cartId === cartId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : i;
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
