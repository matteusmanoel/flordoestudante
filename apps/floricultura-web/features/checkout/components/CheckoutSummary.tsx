'use client';

import { Button } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { CartItem } from '@/features/cart';
import { useCart } from '@/features/cart/store';
import { MediaThumb } from '@/components/shared/MediaThumb';

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  shippingAmount: number;
  total: number;
  fulfillmentType: 'delivery' | 'pickup';
  /** Quando o título já aparece no bloco pai (ex.: checkout em etapas). */
  hideTitle?: boolean;
  /** Permite alterar quantidades e remover itens sem sair do checkout. */
  editable?: boolean;
};

export function CheckoutSummary({
  items,
  subtotal,
  shippingAmount,
  total,
  fulfillmentType,
  hideTitle = false,
  editable = false,
}: CheckoutSummaryProps) {
  const { setQuantity, removeItem } = useCart();

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      {!hideTitle ? (
        <h3 className="font-serif text-lg font-medium text-foreground">Resumo do pedido</h3>
      ) : null}
      <ul className="space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              <MediaThumb src={item.imageUrl} alt={item.name} fill sizes="56px" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="line-clamp-2 font-medium text-foreground">{item.name}</span>
              <span className="text-muted-foreground">
                {formatCurrency(item.unitPrice, { currency: 'BRL', locale: 'pt-BR' })} × {item.quantity}
              </span>
              {editable && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, Math.min(99, item.quantity + 1))}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
            <span className="shrink-0 self-start font-medium text-foreground sm:self-center">
              {formatCurrency(item.lineTotal, { currency: 'BRL', locale: 'pt-BR' })}
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-border pt-3">
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
