'use client';

import { Card } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { OrderPaymentView } from '@/features/payments/data-order';

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
    <Card className="divide-y divide-border">
      <div className="px-4 py-3">
        <h2 className="font-serif text-lg font-medium text-foreground">Itens do pedido</h2>
      </div>
      <ul className="px-4 py-2">
        {order.items.map((item) => (
          <li
            key={item.name + item.quantity.toString()}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span className="text-foreground">
              {item.name}{' '}
              <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(item.lineTotal, { currency: 'BRL', locale: 'pt-BR' })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

