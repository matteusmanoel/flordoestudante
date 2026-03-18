'use client';

import { formatCurrency } from '@flordoestudante/utils';
import type { CartItem } from '@/features/cart';

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  shippingAmount: number;
  total: number;
  fulfillmentType: 'delivery' | 'pickup';
};

export function CheckoutSummary({
  items,
  subtotal,
  shippingAmount,
  total,
  fulfillmentType,
}: CheckoutSummaryProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <h3 className="font-serif text-lg font-medium text-foreground">Resumo do pedido</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(item.lineTotal, { currency: 'BRL', locale: 'pt-BR' })}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">
            {formatCurrency(subtotal, { currency: 'BRL', locale: 'pt-BR' })}
          </span>
        </div>
        {fulfillmentType === 'delivery' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entrega</span>
            <span className="text-foreground">
              {formatCurrency(shippingAmount, { currency: 'BRL', locale: 'pt-BR' })}
            </span>
          </div>
        )}
        {fulfillmentType === 'pickup' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Retirada</span>
            <span className="text-foreground">R$ 0,00</span>
          </div>
        )}
        <div className="flex justify-between pt-2 font-medium text-foreground">
          <span>Total</span>
          <span>{formatCurrency(total, { currency: 'BRL', locale: 'pt-BR' })}</span>
        </div>
      </div>
    </div>
  );
}
