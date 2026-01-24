
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product, ProductVariant, CartItem } from '@/lib/types';

/**
 * @interface CartContextType
 * Defines the shape of the cart context, including the cart state and action functions.
 */
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * CartProvider is a component that provides cart state and actions to its children.
 * It manages the shopping cart logic, including adding, removing, and updating items,
 * and persists the cart state to localStorage.
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The CartContext.Provider component.
 */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Effect to load the cart from localStorage on initial render.
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

  // Effect to save the cart to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem('podiumwear-cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Adds a product variant to the cart. If the item already exists, its quantity is incremented.
   * @param {Product} product - The parent product object.
   * @param {ProductVariant} variant - The specific product variant being added.
   */
  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.variantId === variant.id
      );
      if (existingItem) {
        // If item exists, increment quantity.
        return prevCart.map((cartItem) =>
          cartItem.variantId === variant.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      // If item doesn't exist, create a new cart item.
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

  /**
   * Removes an item completely from the cart.
   * @param {string} variantId - The ID of the variant to remove.
   */
  const removeFromCart = (variantId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.variantId !== variantId));
  };

  /**
   * Updates the quantity of a specific item in the cart.
   * If the quantity is less than 1, the item is removed.
   * @param {string} variantId - The ID of the variant to update.
   * @param {number} quantity - The new quantity for the item.
   */
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

  /**
   * Clears all items from the shopping cart.
   */
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

/**
 * useCart is a custom hook that provides easy access to the CartContext.
 * It should be used by any component that needs to interact with the shopping cart.
 * @returns {CartContextType} The cart context value.
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
