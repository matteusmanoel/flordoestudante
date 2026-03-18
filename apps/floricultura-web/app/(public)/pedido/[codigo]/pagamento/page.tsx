import { notFound } from 'next/navigation';
import { getOrderPaymentView } from '@/features/payments/data-order';
import { PedidoPagamentoClient } from './PedidoPagamentoClient';

export const metadata = {
  title: 'Pagamento do pedido — Flor do Estudante',
  description: 'Conclua o pagamento ou veja o status do seu pedido.',
};

type Props = {
  params: Promise<{ codigo: string }>;
};

export default async function PedidoPagamentoPage({ params }: Props) {
  const { codigo } = await params;
  const decoded = decodeURIComponent(codigo);
  const view = await getOrderPaymentView(decoded);
  if (!view) {
    notFound();
  }

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="container px-4">
        <h1 className="mb-8 font-serif text-2xl font-medium text-foreground sm:text-3xl">
          Seu pedido
        </h1>
        <PedidoPagamentoClient initial={view} />
      </div>
    </div>
  );
}
