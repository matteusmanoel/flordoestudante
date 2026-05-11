/**
 * Helpers e cálculos do carrinho.
 * Centraliza lógica para evitar duplicação nos componentes.
 */

import { roundCurrency } from '@flordoestudante/utils';
import type { CartItem } from './types';

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return roundCurrency(unitPrice * quantity);
}

export function getSubtotal(items: CartItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.lineTotal, 0);
  return roundCurrency(sum);
}

export function getTotalItemCount(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

export function findItemByProductId(items: CartItem[], productId: string): CartItem | undefined {
  return items.find((item) => item.productId === productId);
}

export function sanitizeQuantity(qty: number): number {
  if (Number.isNaN(qty) || qty < MIN_QUANTITY) return MIN_QUANTITY;
  if (qty > MAX_QUANTITY) return MAX_QUANTITY;
  return Math.floor(qty);
}

/**
 * Cria um CartItem a partir dos dados do produto (PDP ou card).
 */
export function createCartItem(
  product: {
    id: string;
    slug: string;
    name: string;
    categoryName?: string;
    coverImageUrl?: string;
    price: number;
  },
  quantity: number,
  giftMessage?: string
): CartItem {
  const qty = sanitizeQuantity(quantity);
  const unitPrice = roundCurrency(Number(product.price));
  const lineTotal = calculateLineTotal(unitPrice, qty);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    categoryName: product.categoryName ?? '',
    imageUrl: product.coverImageUrl ?? '',
    unitPrice,
    quantity: qty,
    lineTotal,
    ...(giftMessage?.trim() ? { giftMessage: giftMessage.trim() } : {}),
  };
}

/**
 * Atualiza a quantidade de um item e recalcula lineTotal.
 * Retorna novo array; remove o item se quantidade <= 0.
 */
export function updateItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number
): CartItem[] {
  const qty = sanitizeQuantity(quantity);
  if (qty <= 0) {
    return items.filter((item) => item.productId !== productId);
  }
  return items.map((item) => {
    if (item.productId !== productId) return item;
    const lineTotal = calculateLineTotal(item.unitPrice, qty);
    return { ...item, quantity: qty, lineTotal };
  });
}

/**
 * Adiciona ou atualiza item no carrinho (merge por productId).
 * Itens recém-adicionados ou atualizados ficam no topo da lista.
 * Se o novo item tem gift message, prevalece sobre o existente.
 */
export function mergeItemIntoCart(items: CartItem[], newItem: CartItem): CartItem[] {
  const existing = findItemByProductId(items, newItem.productId);
  if (!existing) {
    return [newItem, ...items];
  }
  const mergedQty = sanitizeQuantity(existing.quantity + newItem.quantity);
  const mergedLineTotal = calculateLineTotal(existing.unitPrice, mergedQty);
  const imageUrl =
    newItem.imageUrl.trim().length > 0 ? newItem.imageUrl : existing.imageUrl;
  const merged: CartItem = {
    ...existing,
    quantity: mergedQty,
    lineTotal: mergedLineTotal,
    imageUrl,
    giftMessage: newItem.giftMessage ?? existing.giftMessage,
  };
  const rest = items.filter((item) => item.productId !== newItem.productId);
  return [merged, ...rest];
}
