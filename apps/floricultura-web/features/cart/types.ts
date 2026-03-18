/**
 * Modelo do carrinho — alinhado ao OrderItemSnapshot e ao futuro checkout.
 * Snapshot do produto no momento da adição.
 */

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
}

/**
 * Payload derivável do carrinho para o checkout (próxima etapa).
 * Subtotal já calculado; shipping e discount serão aplicados no checkout.
 */
export interface CartCheckoutPayload {
  items: Array<{
    product_id: string;
    product_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
    line_total: number;
  }>;
  subtotal: number;
}
