'use client';

import { Card } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { OrderPaymentView } from '@/features/payments/data-order';

type Props = {
  order: OrderPaymentView;
  paymentCta?: React.ReactNode;
};

export function OrderFinancialSummary({ order, paymentCta }: Props) {
  const { subtotalAmount, shippingAmount, discountAmount, totalAmount } = order;

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <h2 className="font-serif text-lg font-medium text-foreground">Resumo financeiro</h2>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">
            {formatCurrency(subtotalAmount, { currency: 'BRL', locale: 'pt-BR' })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {order.fulfillmentType === 'delivery' ? 'Entrega' : 'Retirada'}
          </span>
          <span className="text-foreground">
            {order.fulfillmentType === 'delivery'
              ? formatCurrency(shippingAmount, { currency: 'BRL', locale: 'pt-BR' })
              : 'R$ 0,00'}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Descontos</span>
            <span className="text-foreground">
              -{' '}
              {formatCurrency(discountAmount, { currency: 'BRL', locale: 'pt-BR' })}
            </span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
          <span>Total</span>
          <span>
            {formatCurrency(totalAmount, { currency: 'BRL', locale: 'pt-BR' })}
          </span>
        </div>
      </div>
      {paymentCta && <div className="pt-2">{paymentCta}</div>}
    </Card>
  );
}

