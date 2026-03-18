/**
 * Prepara o payload do carrinho para o checkout (próxima etapa).
 * Subtotal calculado; shipping e discount serão aplicados no fluxo de checkout.
 */

import { getSubtotal } from './helpers';
import type { CartItem, CartCheckoutPayload } from './types';

export function cartToCheckoutPayload(items: CartItem[]): CartCheckoutPayload {
  const subtotal = getSubtotal(items);
  return {
    items: items.map((item) => ({
      product_id: item.productId,
      product_name_snapshot: item.name,
      unit_price_snapshot: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    })),
    subtotal,
  };
}
