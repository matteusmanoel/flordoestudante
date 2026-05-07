'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@flordoestudante/ui';
import { useCart } from '@/features/cart/store';
import { CheckoutEmptyState, CheckoutForm } from '@/features/checkout/components';
import type { ShippingRuleOption } from '@/features/checkout/types';

type CheckoutPageClientProps = {
  activeShippingRule: ShippingRuleOption | null;
};

export function CheckoutPageClient({ activeShippingRule }: CheckoutPageClientProps) {
  const { items, hydrated, preferredFulfillment } = useCart();
  const firstGiftMessage = items.find((i) => i.giftMessage)?.giftMessage ?? '';

  if (!hydrated) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin shrink-0 text-primary" aria-hidden />
          <span>Preparando checkout…</span>
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-12 w-full max-w-lg" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return <CheckoutEmptyState />;
  }

  return (
    <CheckoutForm
      activeShippingRule={activeShippingRule}
      initialGiftMessage={firstGiftMessage}
      initialFulfillment={preferredFulfillment}
    />
  );
}
