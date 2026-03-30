import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@flordoestudante/ui';
import { getOrderPaymentView } from '@/features/payments/data-order';
import {
  OrderTrackingHeader,
  OrderItemsList,
  OrderFinancialSummary,
  OrderTrackingEmptyState,
} from '@/features/orders';
import { PAYMENT_STATUS, ORDER_STATUS } from '@flordoestudante/core';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { buildWhatsAppOrderConfirmation } from '@flordoestudante/notifications';
import { STORE_WHATSAPP } from '@/lib/constants';
import { getPublicSiteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Acompanhar pedido — Flor do Estudante',
  description: 'Veja o status do seu pedido na Flor do Estudante.',
};

type Props = {
  params: Promise<{ codigo: string }>;
};

export default async function PedidoPublicPage({ params }: Props) {
  const { codigo } = await params;
  const decoded = decodeURIComponent(codigo);
  const order = await getOrderPaymentView(decoded);

  if (decoded.trim().length === 0) {
    notFound();
  }

  if (!order) {
    return (
      <div className="min-h-screen py-10 sm:py-16">
        <div className="container px-4">
          <OrderTrackingEmptyState />
        </div>
      </div>
    );
  }

  const isMp = order.paymentMethod === 'mercado_pago';
  const awaitingPayment =
    isMp &&
    order.status === ORDER_STATUS.PENDING_PAYMENT &&
    (order.paymentStatus === PAYMENT_STATUS.PENDING ||
      order.paymentStatus === PAYMENT_STATUS.FAILED ||
      order.paymentStatus === PAYMENT_STATUS.CANCELLED);

  const expired =
    order.paymentStatus === PAYMENT_STATUS.EXPIRED ||
    order.status === ORDER_STATUS.EXPIRED;

  const paymentCta =
    isMp && awaitingPayment && !expired ? (
      order.payment?.mpInitPoint ? (
        <Button asChild className="w-full" size="lg">
          <a href={order.payment.mpInitPoint} rel="noopener noreferrer">
            Pagar com Mercado Pago
          </a>
        </Button>
      ) : (
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href={`/pedido/${encodeURIComponent(order.publicCode)}/pagamento`}>
            Ir para pagamento
          </Link>
        </Button>
      )
    ) : null;

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="container px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/catalogo">← Ver catálogo</Link>
          </Button>
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <OrderTrackingHeader order={order} />
            <OrderItemsList order={order} />
            {order.customerNote && (
              <div className="rounded-lg border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Observação do pedido</p>
                <p className="mt-1 whitespace-pre-wrap">{order.customerNote}</p>
              </div>
            )}
            {order.estimatedText && (
              <div className="rounded-lg border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Prazo estimado</p>
                <p className="mt-1">{order.estimatedText}</p>
              </div>
            )}
          </div>
          <div className="space-y-4 lg:self-start">
            <OrderFinancialSummary order={order} paymentCta={paymentCta} />
            {(order.status === ORDER_STATUS.AWAITING_APPROVAL || order.status === ORDER_STATUS.PAID) && (
              <WhatsAppCTA
                phone={STORE_WHATSAPP}
                message={buildWhatsAppOrderConfirmation({
                  customerName: '',
                  publicCode: order.publicCode,
                  totalAmount: order.totalAmount,
                  items: order.items.map((i) => `${i.quantity}x ${i.name}`),
                  siteUrl: getPublicSiteUrl(),
                })}
                label="Enviar pedido no WhatsApp"
                size="lg"
                className="w-full"
              />
            )}
            <div className="rounded-lg border border-border bg-muted/10 p-4 text-xs text-muted-foreground">
              <p>
                Em caso de dúvida, fale com a Flor do Estudante informando o código do
                pedido. O status exibido aqui pode levar alguns instantes para atualizar
                após o pagamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

