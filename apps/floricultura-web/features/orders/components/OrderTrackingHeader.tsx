'use client';

import { Badge } from '@flordoestudante/ui';
import { getOrderStatusMessage, getPaymentStatusMessage } from '../status-messages';
import type { OrderPaymentView } from '@/features/payments/data-order';

type Props = {
  order: OrderPaymentView;
};

export function OrderTrackingHeader({ order }: Props) {
  const orderMsg = getOrderStatusMessage(order.status);
  const payMsg = getPaymentStatusMessage(order.paymentStatus);

  return (
    <header className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedido</p>
          <p className="font-mono text-lg font-medium text-foreground">
            {order.publicCode}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{orderMsg.label}</Badge>
            <Badge variant="secondary">{payMsg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {order.fulfillmentType === 'delivery' ? 'Entrega' : 'Retirada na loja'} •{' '}
            {order.paymentMethod === 'mercado_pago'
              ? 'Pagamento online'
              : order.paymentMethod === 'pay_on_delivery'
                ? 'Pagar na entrega'
                : 'Pagar na retirada'}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{orderMsg.description}</p>
      {order.estimatedText ? (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <span className="font-medium">Prazo / previsão: </span>
          {order.estimatedText}
        </p>
      ) : null}
    </header>
  );
}

