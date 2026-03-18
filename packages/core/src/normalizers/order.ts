/**
 * Funções puras de normalização/cálculo para pedido.
 */

import { roundCurrency } from '@flordoestudante/utils';
import type { OrderItemSnapshot } from '../types/order';

/**
 * Calcula subtotal a partir dos itens.
 */
export function calculateSubtotal(items: OrderItemSnapshot[]): number {
  const sum = items.reduce((acc, item) => acc + item.line_total, 0);
  return roundCurrency(sum);
}

/**
 * Calcula total: subtotal + shipping - discount.
 */
export function calculateTotal(
  subtotal: number,
  shippingAmount: number,
  discountAmount: number
): number {
  return roundCurrency(subtotal + shippingAmount - discountAmount);
}

/**
 * Calcula line_total de um item.
 */
export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return roundCurrency(unitPrice * quantity);
}
