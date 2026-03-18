'use client';

/**
 * Store do carrinho com persistência em localStorage.
 * Hidratação: estado inicial [] no SSR; no client, useEffect carrega do storage.
 * Use `hydrated` para evitar flash de contagem (ex.: não mostrar badge até saber o valor real).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getLocalItem, setLocalItem } from '@flordoestudante/utils';
import type { CartItem } from './types';
import {
  getSubtotal,
  getTotalItemCount,
  updateItemQuantity,
  mergeItemIntoCart,
  createCartItem,
} from './helpers';

const CART_STORAGE_KEY = 'flor_cart';

function loadCartFromStorage(): CartItem[] {
  const raw = getLocalItem<CartItem[]>(CART_STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item) =>
      item &&
      typeof item.productId === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity >= 1
  );
}

function saveCartToStorage(items: CartItem[]): void {
  setLocalItem(CART_STORAGE_KEY, items);
}

export interface CartStoreValue {
  items: CartItem[];
  hydrated: boolean;
  subtotal: number;
  totalItemCount: number;
  /** Mensagem exibida após adicionar item (ex.: nome do produto); some após 2s */
  toastMessage: string | null;
  addItem: (product: Parameters<typeof createCartItem>[0], quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartStoreValue | null>(null);

const TOAST_DURATION_MS = 2500;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(loadCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCartToStorage(items);
  }, [items, hydrated]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const addItem = useCallback(
    (product: Parameters<typeof createCartItem>[0], quantity = 1) => {
      const newItem = createCartItem(product, quantity);
      setItems((prev) => mergeItemIntoCart(prev, newItem));
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage(`${product.name} adicionado ao carrinho`);
      toastTimeoutRef.current = setTimeout(() => {
        setToastMessage(null);
        toastTimeoutRef.current = null;
      }, TOAST_DURATION_MS);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => updateItemQuantity(prev, productId, quantity));
  }, []);

  const incrementQuantity = useCallback((productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      return updateItemQuantity(prev, productId, item.quantity + 1);
    });
  }, []);

  const decrementQuantity = useCallback((productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      return updateItemQuantity(prev, productId, item.quantity - 1);
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => getSubtotal(items), [items]);
  const totalItemCount = useMemo(() => getTotalItemCount(items), [items]);

  const value = useMemo<CartStoreValue>(
    () => ({
      items,
      hydrated,
      subtotal,
      totalItemCount,
      toastMessage,
      addItem,
      removeItem,
      setQuantity,
      incrementQuantity,
      decrementQuantity,
      clear,
    }),
    [
      items,
      hydrated,
      subtotal,
      totalItemCount,
      toastMessage,
      addItem,
      removeItem,
      setQuantity,
      incrementQuantity,
      decrementQuantity,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartStoreValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
