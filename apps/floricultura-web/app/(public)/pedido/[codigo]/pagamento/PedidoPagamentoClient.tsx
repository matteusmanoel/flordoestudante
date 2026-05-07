'use client';

import { useEffect, useState } from 'react';
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

  const isMp =
    initial.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO ||
    // Pedidos do agente podem ter payment_method nulo ainda; tratar como MP por padrão.
    !initial.paymentMethod ||
    initial.paymentMethod === 'null';

  const awaitingOnlinePay =
    isMp &&
    (initial.status === ORDER_STATUS.PENDING_PAYMENT || initial.status === ORDER_STATUS.DRAFT) &&
    (initial.payment == null ||
      initial.paymentStatus === PAYMENT_STATUS.PENDING ||
      initial.paymentStatus === PAYMENT_STATUS.FAILED ||
      initial.paymentStatus === PAYMENT_STATUS.CANCELLED);

  const paid =
    initial.paymentStatus === PAYMENT_STATUS.PAID ||
    initial.status === ORDER_STATUS.AWAITING_APPROVAL;

  const expired =
    initial.paymentStatus === PAYMENT_STATUS.EXPIRED || initial.status === ORDER_STATUS.EXPIRED;

  // Pedido do agente sem payments row: tentar gerar link automaticamente ao carregar.
  useEffect(() => {
    if (awaitingOnlinePay && !initPoint && !mpError && !retrying) {
      void handleRetry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Cabeçalho do pedido */}
      <div className="rounded-lg border border-border bg-muted/20 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pedido</p>
        <p className="mt-1 font-mono text-xl font-semibold text-foreground">{initial.publicCode}</p>

        {/* Itens */}
        {initial.items.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-border pt-4">
            {initial.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.quantity > 1 && (
                    <span className="mr-1 text-muted-foreground">{item.quantity}×</span>
                  )}
                  {item.name}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(item.lineTotal, { currency: 'BRL', locale: 'pt-BR' })}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Totais */}
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          {initial.shippingAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Entrega</span>
              <span>{formatCurrency(initial.shippingAmount, { currency: 'BRL', locale: 'pt-BR' })}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-foreground">
            <span>Total</span>
            <span>{formatCurrency(initial.totalAmount, { currency: 'BRL', locale: 'pt-BR' })}</span>
          </div>
        </div>

        {/* Endereço de entrega */}
        {initial.fulfillmentType === 'delivery' && initial.addressSnapshot && (
          <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Entrega para</p>
            {initial.addressSnapshot.recipientName && (
              <p className="mt-0.5">{initial.addressSnapshot.recipientName}</p>
            )}
            {initial.addressSnapshot.street && (
              <p>
                {initial.addressSnapshot.street}
                {initial.addressSnapshot.number ? `, ${initial.addressSnapshot.number}` : ''}
                {initial.addressSnapshot.complement ? ` — ${initial.addressSnapshot.complement}` : ''}
              </p>
            )}
            {initial.addressSnapshot.neighborhood && (
              <p>
                {initial.addressSnapshot.neighborhood}
                {initial.addressSnapshot.city
                  ? ` — ${initial.addressSnapshot.city}/${initial.addressSnapshot.state}`
                  : ''}
              </p>
            )}
            {initial.addressSnapshot.postalCode && (
              <p>CEP {initial.addressSnapshot.postalCode}</p>
            )}
          </div>
        )}

        {/* Mensagem do cartão */}
        {initial.giftMessage && (
          <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
            <p className="text-xs font-medium text-muted-foreground">Mensagem do cartão</p>
            <p className="mt-0.5 italic">&ldquo;{initial.giftMessage}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Pagamento offline */}
      {isOffline && (
        <div className="rounded-lg border border-border p-5">
          <h2 className="font-serif text-xl font-medium text-foreground">Pedido registrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você escolheu{' '}
            <strong>
              {initial.paymentMethod === PAYMENT_METHOD.PAY_ON_DELIVERY
                ? 'pagar na entrega'
                : 'pagar na retirada'}
            </strong>
            . O valor será cobrado no momento da{' '}
            {initial.fulfillmentType === 'delivery' ? 'entrega' : 'retirada'}.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Seu pedido segue para <strong>aprovação manual</strong> pela loja. Entraremos em
            contato em breve.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/catalogo">Continuar comprando</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Início</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Pagamento confirmado */}
      {isMp && paid && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-serif text-xl font-medium text-foreground">Pagamento confirmado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Recebemos seu pagamento. O pedido está em{' '}
            <strong>{ORDER_STATUS_LABELS[ORDER_STATUS.AWAITING_APPROVAL]}</strong> — a loja irá
            analisar e confirmar em breve.
          </p>
          <Button asChild className="mt-5">
            <Link href="/catalogo">Continuar comprando</Link>
          </Button>
        </div>
      )}

      {/* Pagamento expirado */}
      {isMp && expired && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-serif text-xl font-medium text-foreground">Pagamento expirado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O prazo para pagamento online deste pedido encerrou. Entre em contato com a loja
            informando o código do pedido.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/">Início</Link>
          </Button>
        </div>
      )}

      {/* Aguardando pagamento online */}
      {isMp && awaitingOnlinePay && !expired && (
        <div className="rounded-lg border border-border p-5">
          <h2 className="font-serif text-xl font-medium text-foreground">Pagamento online</h2>

          {!retrying && initial.payment?.expiresAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Link válido até{' '}
              {new Date(initial.payment.expiresAt).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
              })}
            </p>
          )}

          {retrying && (
            <p className="mt-2 text-sm text-muted-foreground animate-pulse">
              Gerando link de pagamento…
            </p>
          )}

          {mpError && !retrying && (
            <p className="mt-3 text-sm text-destructive">{mpError}</p>
          )}

          {!retrying && (
            <div className="mt-5 space-y-3">
              {initPoint ? (
                <>
                  <Button asChild className="w-full" size="lg">
                    <a href={initPoint} rel="noopener noreferrer">
                      Pagar com Mercado Pago
                    </a>
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Pagamento disponível via PIX e cartão.
                  </p>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full"
                  size="lg"
                >
                  Gerar link de pagamento
                </Button>
              )}

              {initPoint && mpError && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full"
                  size="sm"
                >
                  Gerar novo link
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status genérico (não se enquadra nos casos acima) */}
      {isMp && !awaitingOnlinePay && !paid && !expired && (
        <div className="rounded-lg border border-border p-5 text-sm text-muted-foreground">
          <p>
            Situação do pedido:{' '}
            {ORDER_STATUS_LABELS[initial.status as keyof typeof ORDER_STATUS_LABELS] ??
              initial.status}
          </p>
          {initial.payment?.status && (
            <p className="mt-1">
              Pagamento:{' '}
              {(PAYMENT_STATUS_LABELS as Record<string, string>)[initial.payment.status] ??
                initial.payment.status}
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href="/">Início</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
