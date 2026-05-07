'use client';

import { Card } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { OrderPaymentView } from '@/features/payments/data-order';
import { MediaThumb } from '@/components/shared/MediaThumb';

type Props = {
  order: OrderPaymentView;
};

export function OrderItemsList({ order }: Props) {
  if (!order.items.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Os itens do pedido não estão disponíveis no momento.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <h2 className="font-display text-lg font-medium text-foreground">O que você acabou de comprar</h2>
      </div>
      <ul className="divide-y divide-border">
        {order.items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="flex gap-3 p-4"
          >
            {/* Imagem do produto */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20">
              {item.imageUrl ? (
                <MediaThumb
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/60">
                  <svg
                    className="h-6 w-6 text-muted-foreground/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Info do item */}
            <div className="flex flex-1 flex-col justify-between gap-1">
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Quantidade: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(item.lineTotal, { currency: 'BRL', locale: 'pt-BR' })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
