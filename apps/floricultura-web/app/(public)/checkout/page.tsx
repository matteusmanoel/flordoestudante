import { getActiveShippingRule } from '@/features/checkout/data';
import { CheckoutPageClient } from './CheckoutPageClient';

export const metadata = {
  title: 'Finalizar pedido — Flor do Estudante',
  description: 'Finalize seu pedido com segurança e carinho.',
};

export default async function CheckoutPage() {
  const activeShippingRule = await getActiveShippingRule();

  return (
    <div
      id="checkout-page-top"
      className="min-h-screen scroll-mt-20 py-8 sm:scroll-mt-24 sm:py-12"
    >
      <div className="container px-4">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
            Preparando algo especial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Finalize com carinho — é só mais um passo.
          </p>
        </div>
        <CheckoutPageClient activeShippingRule={activeShippingRule} />
      </div>
    </div>
  );
}
