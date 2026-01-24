
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product, ProductVariant, CartItem } from '@/lib/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('podiumwear-cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('podiumwear-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.variantId === variant.id
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.variantId === variant.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      const newCartItem: CartItem = {
          productId: product.id!,
          variantId: variant.id,
          quote: product.quote,
          imageUrl: variant.imageUrl,
          price: variant.price,
          fit: variant.fit,
          color: variant.color,
          size: variant.size,
          quantity: 1,
          qikinkSku: variant.qikinkSku,
          designCode: variant.designCode,
          mockupLink: variant.mockupLink || '',
      }
      return [...prevCart, newCartItem];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(variantId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
