import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { getActiveShippingRule } from '@/features/checkout/data';
import { CheckoutPageClient } from './CheckoutPageClient';

export const metadata = {
  title: 'Checkout — Flor do Estudante',
  description: 'Finalize seu pedido com segurança.',
};

export default async function CheckoutPage() {
  const activeShippingRule = await getActiveShippingRule();

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/carrinho">← Voltar ao carrinho</Link>
          </Button>
        </div>
        <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
          Finalizar pedido
        </h1>
        <div className="mt-8">
          <CheckoutPageClient activeShippingRule={activeShippingRule} />
        </div>
      </div>
    </div>
  );
}
