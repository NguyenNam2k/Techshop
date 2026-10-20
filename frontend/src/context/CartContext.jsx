import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { api } from '../services/api';
import { registerCartBridge } from './cartBridge';

const CartContext = createContext(null);
const readLocalCart = () => {
  try {
    const value = JSON.parse(localStorage.getItem('techshop_cart') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};
const isNumericId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const toLocalItem = (product, variant, quantity) => {
  const price = Number(variant?.price ?? product.price ?? product.base_price ?? 0);
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    variantId: variant?.id ?? null,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      thumbnail_url: product.thumbnail_url || product.images?.[0],
      images: product.images || [product.thumbnail_url].filter(Boolean),
      available_variants: product.variants || product.available_variants || (variant ? [variant] : [])
    },
    variant: variant || {
      id: null,
      color: 'Tiêu chuẩn',
      spec_version: 'Bản tiêu chuẩn',
      price,
      stock: product.stockCount || 10,
      image_url: product.thumbnail_url || product.images?.[0]
    },
    price,
    quantity,
    subtotal: price * quantity,
    localOnly: true
  };
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readLocalCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cartError, setCartError] = useState('');
  const operationRevision = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem('techshop_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage', error);
    }
  }, [cartItems]);

  useEffect(() => {
    let active = true;
    const revision = operationRevision.current;
    const cachedItems = readLocalCart();

    const load = async () => {
      setIsSyncing(true);
      try {
        const remoteCart = await api.getCart();
        if (!active || revision !== operationRevision.current) return;
        if (remoteCart.items?.length) {
          setCartItems(remoteCart.items);
          setCartError('');
          return;
        }

        // Restore cached database-backed lines when the server cart is empty.
        const restorable = cachedItems.filter(item =>
          isNumericId(item.variant?.id ?? item.variantId) &&
          isNumericId(item.product?.id)
        );
        if (restorable.length) {
          const syncedCart = await api.syncCart(restorable.map(item => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? item.variantId,
            quantity: Number(item.quantity)
          })));
          if (active && revision === operationRevision.current) {
            setCartItems(syncedCart.items);
          }
        } else if (!cachedItems.length) {
          setCartItems([]);
        }
      } catch (error) {
        // Keep the local cache visible, but surface that it is not synchronized with the server.
        if (active) {
          console.warn('Backend cart sync failed; keeping the local cart:', error.message);
          setCartError(error.response?.data?.message || error.message || 'Không thể đồng bộ giỏ hàng với máy chủ.');
        }
      } finally {
        if (active) setIsSyncing(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const cartSubtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.variant?.price ?? item.price ?? item.product?.price ?? 0);
    return sum + price * (Number(item.quantity) || 0);
  }, 0);

  const setRemoteCart = useCallback((data) => {
    operationRevision.current += 1;
    setCartItems(data.items || []);
    setCartError('');
  }, []);

  const addToCart = useCallback(async (product, variant, requestedQuantity = 1) => {
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(requestedQuantity) || 1)));
    const variants = Array.isArray(product.variants)
      ? product.variants
      : Array.isArray(product.available_variants)
        ? product.available_variants
        : [];
    const selectedVariant = variant ||
      variants.find(item => Number(item.stock) > 0 && item.status !== 'discontinued') ||
      variants[0] ||
      null;
    const variantId = selectedVariant?.id;

    if (isNumericId(variantId) && isNumericId(product.id)) {
      try {
        const data = await api.addToCart(Number(variantId), quantity, Number(product.id));
        setRemoteCart(data);
        return true;
      } catch (error) {
        setCartError(error.response?.data?.message || error.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
        return false;
      }
    }

    // A database product must never become a local-only line: checkout trusts the
    // server cart and would otherwise reject it (or show a misleading subtotal).
    if (isNumericId(product.id)) {
      setCartError('Sản phẩm chưa có cấu hình hợp lệ trên máy chủ. Vui lòng tải lại trang.');
      return false;
    }

    if (selectedVariant && Number(selectedVariant.stock) <= 0) {
      setCartError('Cấu hình sản phẩm này hiện đã hết hàng.');
      return false;
      }

    operationRevision.current += 1;
    const newItem = toLocalItem(product, selectedVariant, quantity);
    setCartItems(previous => {
      const selectedId = selectedVariant?.id;
      const existingIndex = previous.findIndex(item =>
        selectedId != null
          ? String(item.variant?.id ?? item.variantId) === String(selectedId)
          : String(item.product?.id) === String(product.id) && item.variant?.color === selectedVariant?.color
      );
      if (existingIndex < 0) return [newItem, ...previous];
      return previous.map((item, index) => index === existingIndex
        ? {
            ...item,
            quantity: Number(item.quantity) + quantity,
            subtotal: Number(item.price) * (Number(item.quantity) + quantity)
          }
        : item);
    });
    setCartError('');
    return true;
  }, [setRemoteCart]);

  const changeVariant = useCallback(async (itemId, newVariant) => {
    if (!newVariant) return false;
    const item = cartItems.find(entry => String(entry.id) === String(itemId));
    if (!item) return false;

    if (!item.localOnly && isNumericId(item.id) && isNumericId(newVariant.id)) {
      try {
        const data = await api.updateCartItem(item.id, { variantId: Number(newVariant.id) });
        setRemoteCart(data);
        return true;
      } catch (error) {
        setCartError(error.response?.data?.message || error.message);
        return false;
      }
    }

    operationRevision.current += 1;
    setCartItems(previous => {
      const updated = previous.map(entry => entry.id === itemId
        ? {
            ...entry,
            variant: newVariant,
            variantId: newVariant.id ?? null,
            price: Number(newVariant.price ?? entry.price),
            subtotal: Number(newVariant.price ?? entry.price) * Number(entry.quantity)
          }
        : entry);
      const targetIndex = updated.findIndex(entry =>
        entry.id !== itemId &&
        entry.product?.id === item.product?.id &&
        String(entry.variant?.id ?? entry.variantId) === String(newVariant.id)
      );
      const sourceIndex = updated.findIndex(entry => entry.id === itemId);
      if (targetIndex < 0 || sourceIndex < 0) return updated;
      const mergedQuantity = Number(updated[targetIndex].quantity) + Number(updated[sourceIndex].quantity);
      return updated
        .map((entry, index) => index === targetIndex
          ? { ...entry, quantity: mergedQuantity, subtotal: Number(entry.price) * mergedQuantity }
          : entry)
        .filter((_, index) => index !== sourceIndex);
    });
    setCartError('');
    return true;
  }, [cartItems, setRemoteCart]);

  const removeFromCart = useCallback(async (itemId) => {
    const item = cartItems.find(entry => String(entry.id) === String(itemId));
    if (!item) return;
    if (!item.localOnly && isNumericId(item.id)) {
      try {
        const data = await api.removeCartItem(item.id);
        setRemoteCart(data);
        return;
      } catch (error) {
        setCartError(error.response?.data?.message || error.message);
        return;
      }
    }
    operationRevision.current += 1;
    setCartItems(previous => previous.filter(entry => String(entry.id) !== String(itemId)));
  }, [cartItems, setRemoteCart]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (Number(newQuantity) <= 0) {
      await removeFromCart(itemId);
      return;
    }
    const quantity = Math.floor(Number(newQuantity));
    const item = cartItems.find(entry => String(entry.id) === String(itemId));
    if (!item || !Number.isInteger(quantity)) return;

    if (!item.localOnly && isNumericId(item.id)) {
      try {
        const data = await api.updateCartItem(item.id, { quantity });
        setRemoteCart(data);
        return;
      } catch (error) {
        setCartError(error.response?.data?.message || error.message);
        return;
      }
    }

    operationRevision.current += 1;
    setCartItems(previous => previous.map(entry => entry.id === itemId
      ? {
          ...entry,
          quantity,
          subtotal: Number(entry.variant?.price ?? entry.price ?? 0) * quantity
        }
      : entry));
  }, [cartItems, removeFromCart, setRemoteCart]);

  const clearCart = useCallback(async () => {
    try {
      const data = await api.clearCart();
      setRemoteCart(data);
    } catch (error) {
      const hasRemoteLines = cartItems.some(item => !item.localOnly && isNumericId(item.id));
      if (hasRemoteLines) {
        setCartError(error.response?.data?.message || error.message);
        return;
      }
      operationRevision.current += 1;
      setCartItems([]);
    }
  }, [cartItems, setRemoteCart]);

  // Checkout already clears the server cart when it creates the order.
  // Use this to update the local cache without sending a second clear request.
  const clearCartLocally = useCallback(() => {
    operationRevision.current += 1;
    setCartItems([]);
    setCartError('');
  }, []);

  // Guest -> authenticated transition. The guest session token is intentionally
  // kept: the server reads the guest cart from it and moves the lines into the
  // customer cart inside one transaction.
  const mergeGuestCart = useCallback(async () => {
    try {
      const data = await api.mergeCart();
      operationRevision.current += 1;
      setCartItems(previous => {
        // Local-only lines have no database counterpart, so keep them visible
        // instead of dropping them when the server cart replaces the state.
        const localOnly = previous.filter(item => item.localOnly);
        return [...localOnly, ...(data.items || [])];
      });
      setCartError('');
      return data;
    } catch (error) {
      const message = error.response?.data?.message
        || error.message
        || 'Không thể gộp giỏ hàng sau khi đăng nhập.';
      setCartError(message);
      throw new Error(message);
    }
  }, []);

  // Logout: the browser still holds the guest session token, so the customer
  // cart must never be written back into that guest cart. Drop the cached lines
  // and reload whatever the guest session actually owns.
  const resetCartForGuest = useCallback(async () => {
    operationRevision.current += 1;
    setCartItems([]);
    setCartError('');
    try {
      const remote = await api.getCart();
      operationRevision.current += 1;
      setCartItems(remote.items || []);
    } catch (error) {
      console.warn('Unable to reload the guest cart after logout:', error.message);
    }
  }, []);

  useEffect(() => registerCartBridge({
    merge: mergeGuestCart,
    reset: resetCartForGuest
  }), [mergeGuestCart, resetCartForGuest]);

  const clearCartError = useCallback(() => setCartError(''), []);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartSubtotal,
      isCartOpen,
      setIsCartOpen,
      isSyncing,
      cartError,
      clearCartError,
      addToCart,
      changeVariant,
      updateQuantity,
      removeFromCart,
      clearCart,
      clearCartLocally,
      mergeGuestCart,
      resetCartForGuest
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cartItems: [],
      cartCount: 0,
      cartSubtotal: 0,
      isCartOpen: false,
      setIsCartOpen: () => {},
      isSyncing: false,
      cartError: '',
      clearCartError: () => {},
      addToCart: () => {},
      changeVariant: () => {},
      updateQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      clearCartLocally: () => {},
      mergeGuestCart: async () => null,
      resetCartForGuest: async () => {}
    };
  }
  return context;
}
