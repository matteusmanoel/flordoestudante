'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@flordoestudante/core';
import type { OrderPaymentView } from '@/features/payments/data-order';
import { retryMercadoPagoPreference } from '@/features/payments/retry-preference-action';

type Props = {
  initial: OrderPaymentView;
};

export function PedidoPagamentoClient({ initial }: Props) {
  const [initPoint, setInitPoint] = useState(initial.payment?.mpInitPoint ?? null);
  const [mpError, setMpError] = useState(initial.payment?.mpError ?? null);
  const [retrying, setRetrying] = useState(false);

  const isOffline =
    initial.paymentMethod === PAYMENT_METHOD.PAY_ON_DELIVERY ||
    initial.paymentMethod === PAYMENT_METHOD.PAY_ON_PICKUP;

  const isMp = initial.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO;
  const awaitingOnlinePay =
    isMp &&
    initial.status === ORDER_STATUS.PENDING_PAYMENT &&
    (initial.paymentStatus === PAYMENT_STATUS.PENDING ||
      initial.paymentStatus === PAYMENT_STATUS.FAILED ||
      initial.paymentStatus === PAYMENT_STATUS.CANCELLED);

  const paid =
    initial.paymentStatus === PAYMENT_STATUS.PAID ||
    initial.status === ORDER_STATUS.AWAITING_APPROVAL;

  const expired =
    initial.paymentStatus === PAYMENT_STATUS.EXPIRED || initial.status === ORDER_STATUS.EXPIRED;

  async function handleRetry() {
    setRetrying(true);
    setMpError(null);
    const r = await retryMercadoPagoPreference(initial.publicCode);
    setRetrying(false);
    if (r.ok) {
      setInitPoint(r.initPoint);
    } else {
      setMpError(r.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 p-6">
        <p className="text-sm text-muted-foreground">Pedido</p>
        <p className="font-mono text-lg font-medium text-foreground">{initial.publicCode}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Total:{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(initial.totalAmount, { currency: 'BRL', locale: 'pt-BR' })}
          </span>
        </p>
      </div>

      {isOffline && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-serif text-xl font-medium text-foreground">Pedido registrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você escolheu{' '}
            <strong>
              {initial.paymentMethod === PAYMENT_METHOD.PAY_ON_DELIVERY
                ? 'pagar na entrega'
                : 'pagar na retirada'}
            </strong>
            . O valor será cobrado no momento da {initial.fulfillmentType === 'delivery' ? 'entrega' : 'retirada'}.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Seu pedido segue para <strong>aprovação manual</strong> pela loja. Entraremos em contato em breve.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/catalogo">Continuar comprando</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Início</Link>
            </Button>
          </div>
        </div>
      )}

      {isMp && paid && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-serif text-xl font-medium text-foreground">Pagamento confirmado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Recebemos seu pagamento. O pedido está{' '}
            <strong>{ORDER_STATUS_LABELS[ORDER_STATUS.AWAITING_APPROVAL]}</strong> — a loja irá analisar e
            confirmar em breve.
          </p>
          <Button asChild className="mt-6">
            <Link href="/catalogo">Continuar comprando</Link>
          </Button>
        </div>
      )}

      {isMp && expired && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="font-serif text-xl font-medium text-foreground">Pagamento expirado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O prazo para pagamento online deste pedido encerrou. Entre em contato com a loja informando o código do
            pedido.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Início</Link>
          </Button>
        </div>
      )}

      {isMp && awaitingOnlinePay && !expired && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-serif text-xl font-medium text-foreground">Pagamento online</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Status:{' '}
            {(PAYMENT_STATUS_LABELS as Record<string, string>)[initial.paymentStatus] ??
              initial.paymentStatus}
          </p>
          {initial.payment?.expiresAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Link válido até {new Date(initial.payment.expiresAt).toLocaleString('pt-BR')}
            </p>
          )}
          {mpError && (
            <p className="mt-3 text-sm text-destructive">{mpError}</p>
          )}
          {initPoint ? (
            <div className="mt-6 space-y-3">
              <Button asChild className="w-full" size="lg">
                <a href={initPoint} rel="noopener noreferrer">
                  Pagar com Mercado Pago
                </a>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                PIX, cartão e outros meios disponíveis no Mercado Pago.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <Button type="button" onClick={handleRetry} disabled={retrying} className="w-full">
                {retrying ? 'Gerando link...' : 'Gerar link de pagamento'}
              </Button>
            </div>
          )}
        </div>
      )}

      {isMp && !awaitingOnlinePay && !paid && !expired && (
        <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
          <p>
            Situação do pedido: {ORDER_STATUS_LABELS[initial.status as keyof typeof ORDER_STATUS_LABELS] ?? initial.status}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/">Início</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
