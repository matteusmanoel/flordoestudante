'use client';

import { useCart } from '@/features/cart/store';
import { CheckoutEmptyState, CheckoutForm } from '@/features/checkout/components';
import type { ShippingRuleOption } from '@/features/checkout/types';

type CheckoutPageClientProps = {
  activeShippingRule: ShippingRuleOption | null;
};

export function CheckoutPageClient({ activeShippingRule }: CheckoutPageClientProps) {
  const { items, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (items.length === 0) {
    return <CheckoutEmptyState />;
  }

  return <CheckoutForm activeShippingRule={activeShippingRule} />;
}
