import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('techshop_cart')) || [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('techshop_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const addToCart = (product, variant, quantity = 1) => {
    setCartItems(prev => {
      const variantId = variant?.id || 'default';
      const existingIdx = prev.findIndex(
        item => item.product?.id === product?.id && item.variantId === variantId
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, variant, variantId, quantity }];
    });
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cartItems: [],
      cartCount: 0,
      isCartOpen: false,
      setIsCartOpen: () => {},
      addToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {}
    };
  }
  return ctx;
}
