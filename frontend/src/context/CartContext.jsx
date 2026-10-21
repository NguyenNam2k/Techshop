import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { isSingleConfigurationProduct } from '../components/pdp/VariantSelector';

const CartContext = createContext();
const LOCAL_CART_KEY = 'techshop_cart_v3';

function normalizeCartItem(item) {
  if (!item || typeof item !== 'object') return null;

  const productObj = item.product && typeof item.product === 'object' ? item.product : {};
  const variantObj = item.variant && typeof item.variant === 'object' ? item.variant : {};

  const variantId = Number(
    item.variant_id ||
      item.variantId ||
      variantObj.id ||
      item.id
  );
  const cartItemId = Number(item.cart_item_id || item.cartItemId || item.id || variantId);
  const productId = Number(item.product_id || item.productId || productObj.id || variantId);

  const name = String(
    item.product_name || productObj.name || item.name || 'Sản phẩm Techshop'
  );
  const brand = String(item.brand || productObj.brand || 'Techshop');
  const slug = String(item.product_slug || productObj.slug || item.slug || '');
  const sku = String(item.sku || variantObj.sku || '');

  const color = String(item.color || variantObj.color || 'Tiêu chuẩn');
  const specVersion = String(
    item.spec_version ||
      item.specVersion ||
      variantObj.spec_version ||
      variantObj.specVersion ||
      'Bản tiêu chuẩn'
  );

  const variantLabel =
    typeof item.variant === 'string' && item.variant.trim()
      ? item.variant
      : color && specVersion && color !== specVersion
      ? `${color} - ${specVersion}`
      : color || specVersion || 'Tiêu chuẩn';

  const price = Number(
    item.unit_price ?? item.price ?? variantObj.price ?? productObj.base_price ?? 0
  );
  const quantity = Math.max(1, Number(item.quantity || 1));
  const stock = Number(item.stock ?? variantObj.stock ?? 20);
  const image = String(
    item.image_url ||
      variantObj.image_url ||
      productObj.thumbnail_url ||
      (typeof item.image === 'string' ? item.image : '') ||
      ''
  );

  const rawVariants = Array.isArray(item.variants)
    ? item.variants
    : Array.isArray(productObj.available_variants)
    ? productObj.available_variants
    : [];

  const categorySlug = item.category_slug || productObj.category_slug || '';
  const categoryId = item.category_id || productObj.category_id || null;
  const categoryName = item.category_name || productObj.category_name || name;

  const hideVariants = isSingleConfigurationProduct({
    categorySlug,
    categoryId,
    categoryName
  });

  const mappedVariants = hideVariants
    ? []
    : rawVariants.map((v) => ({
        ...v,
        id: Number(v.id),
        price: Number(v.price || 0),
        stock: Number(v.stock ?? 0)
      }));

  return {
    id: variantId || cartItemId,
    cartItemId: cartItemId || variantId,
    variantId: variantId || cartItemId,
    productId,
    name,
    brand,
    slug,
    sku,
    color,
    specVersion,
    variant: String(variantLabel),
    price,
    quantity,
    stock: stock > 0 ? stock : 20,
    image,
    variants: mappedVariants
  };
}

function mapServerCart(cart) {
  if (!cart || !Array.isArray(cart.items)) return [];
  return cart.items.map(normalizeCartItem).filter(Boolean);
}

function loadLocalCart() {
  try {
    localStorage.removeItem('techshop_cart_v2');
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean);
  } catch {
    return [];
  }
}

function saveLocalCart(items) {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => loadLocalCart());
  const [loading, setLoading] = useState(false);

  const persistAndSet = useCallback((updater) => {
    setCartItems((prev) => {
      const rawNext = typeof updater === 'function' ? updater(prev) : updater;
      const safeNext = Array.isArray(rawNext)
        ? rawNext.map(normalizeCartItem).filter(Boolean)
        : [];
      saveLocalCart(safeNext);
      return safeNext;
    });
  }, []);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const serverCart = await api.getCart();
      const mapped = mapServerCart(serverCart);
      if (mapped.length > 0) {
        persistAndSet(mapped);
        return mapped;
      }
      const local = loadLocalCart();
      if (local.length > 0) {
        const synced = await api.syncCart(
          local.map((item) => ({
            variantId: item.variantId || item.id,
            quantity: item.quantity
          }))
        );
        const syncedMapped = mapServerCart(synced);
        if (syncedMapped.length > 0) {
          persistAndSet(syncedMapped);
          return syncedMapped;
        }
      }
      return local;
    } catch {
      return loadLocalCart();
    } finally {
      setLoading(false);
    }
  }, [persistAndSet]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product, variant, quantity = 1) => {
    const chosenVariant = variant || product?.variants?.[0] || {};
    const variantId = Number(
      chosenVariant?.id || product?.variantId || product?.default_variant?.id || product?.default_variant_id || product?.id
    );
    const productId = Number(product?.productId || product?.id);
    const qty = Math.max(1, Number(quantity) || 1);

    if (!variantId) {
      throw new Error('Không tìm thấy phiên bản sản phẩm hợp lệ.');
    }

    const color = String(chosenVariant.color || 'Tiêu chuẩn');
    const specVersion = String(
      chosenVariant.spec_version || chosenVariant.specVersion || 'Bản tiêu chuẩn'
    );
    const unitPrice = Number(chosenVariant.price ?? product?.base_price ?? product?.price ?? 0);
    const maxStock = Number(chosenVariant.stock ?? product?.total_stock ?? 20);
    const image =
      chosenVariant.image_url ||
      product?.thumbnail_url ||
      product?.images?.[0]?.image_url ||
      product?.image ||
      '';

    // Optimistic update for instant UI feedback
    persistAndSet((prev) => {
      const idx = prev.findIndex((item) => Number(item.variantId || item.id) === variantId);
      if (idx > -1) {
        const updated = [...prev];
        const nextQty = Math.min(maxStock || 99, updated[idx].quantity + qty);
        updated[idx] = { ...updated[idx], quantity: nextQty };
        return updated;
      }
      return [
        ...prev,
        {
          id: variantId,
          cartItemId: variantId,
          variantId,
          productId,
          name: product?.name || 'Sản phẩm Techshop',
          brand: product?.brand || 'Techshop',
          slug: product?.slug || '',
          sku: chosenVariant.sku || product?.sku_code || '',
          color,
          specVersion,
          variant: `${color} - ${specVersion}`,
          price: unitPrice,
          quantity: Math.min(maxStock || 99, qty),
          stock: maxStock || 20,
          image,
          category_slug: product?.category_slug || '',
          category_id: product?.category_id || null,
          category_name: product?.category_name || '',
          variants: Array.isArray(product?.variants) ? product.variants : []
        }
      ];
    });

    try {
      const serverCart = await api.addToCart(variantId, qty, productId);
      const mapped = mapServerCart(serverCart);
      if (mapped.length > 0) persistAndSet(mapped);
    } catch {
      // Keep optimistic local cart if server call fails transiently
    }
  };

  const updateQuantity = async (id, delta) => {
    const current = cartItems.find(
      (item) => item.id === id || item.cartItemId === id || item.variantId === id
    );
    if (!current) return;
    const nextQty = current.quantity + delta;
    if (nextQty <= 0) {
      await removeItem(id);
      return;
    }
    const clampedQty = Math.min(current.stock || 99, nextQty);

    persistAndSet((prev) =>
      prev.map((item) =>
        item.id === id || item.cartItemId === id || item.variantId === id
          ? { ...item, quantity: clampedQty }
          : item
      )
    );

    try {
      const serverCart = await api.updateCartItem(current.cartItemId || current.id, {
        quantity: clampedQty
      });
      const mapped = mapServerCart(serverCart);
      if (mapped.length > 0) persistAndSet(mapped);
    } catch {
      // Keep optimistic local state
    }
  };

  const updateItemVariant = async (id, nextVariantId) => {
    const current = cartItems.find(
      (item) => item.id === id || item.cartItemId === id || item.variantId === id
    );
    if (!current) return;
    const targetVariantId = Number(nextVariantId);
    if (!Number.isInteger(targetVariantId) || targetVariantId === Number(current.variantId)) return;

    const matchedVariant = (current.variants || []).find(
      (v) => Number(v.id) === targetVariantId
    );
    if (matchedVariant) {
      persistAndSet((prev) =>
        prev.map((item) =>
          item.id === id || item.cartItemId === id || item.variantId === id
            ? {
                ...item,
                id: targetVariantId,
                variantId: targetVariantId,
                sku: matchedVariant.sku || item.sku,
                color: matchedVariant.color || item.color,
                specVersion: matchedVariant.spec_version || item.specVersion,
                variant: `${matchedVariant.color || 'Tiêu chuẩn'} - ${
                  matchedVariant.spec_version || 'Bản tiêu chuẩn'
                }`,
                price: Number(matchedVariant.price || item.price),
                stock: Number(matchedVariant.stock ?? item.stock),
                quantity: Math.min(
                  item.quantity,
                  Math.max(1, Number(matchedVariant.stock || 1))
                )
              }
            : item
        )
      );
    }

    try {
      const serverCart = await api.updateCartItem(current.cartItemId || current.id, {
        variantId: targetVariantId,
        quantity: current.quantity
      });
      const mapped = mapServerCart(serverCart);
      if (mapped.length > 0) persistAndSet(mapped);
    } catch {
      // Keep optimistic local state
    }
  };

  const removeItem = async (id) => {
    const current = cartItems.find(
      (item) => item.id === id || item.cartItemId === id || item.variantId === id
    );
    persistAndSet((prev) =>
      prev.filter(
        (item) => item.id !== id && item.cartItemId !== id && item.variantId !== id
      )
    );
    if (!current) return;
    try {
      const serverCart = await api.removeCartItem(current.cartItemId || current.id);
      const mapped = mapServerCart(serverCart);
      persistAndSet(mapped);
    } catch {
      // Keep optimistic local state
    }
  };

  const clearCart = async () => {
    persistAndSet([]);
    try {
      await api.clearCart();
    } catch {
      // Ignore server clear errors
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        updateItemVariant,
        removeItem,
        clearCart,
        refreshCart,
        cartCount,
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cartItems: [],
      loading: false,
      addToCart: async () => {},
      updateQuantity: async () => {},
      updateItemVariant: async () => {},
      removeItem: async () => {},
      clearCart: async () => {},
      refreshCart: async () => {},
      cartCount: 0,
      subtotal: 0
    };
  }
  return ctx;
}
