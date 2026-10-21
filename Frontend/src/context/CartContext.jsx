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

  const cartTotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.variant?.price || item.product?.base_price || 0;
    return sum + itemPrice * (item.quantity || 1);
  }, 0);

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

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.variantId === variantId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (variantId) => {
    setCartItems(prev => prev.filter(item => item.variantId !== variantId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
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
      cartTotal: 0,
      isCartOpen: false,
      setIsCartOpen: () => {},
      addToCart: () => {},
      updateQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {}
    };
  }
  return ctx;
}
