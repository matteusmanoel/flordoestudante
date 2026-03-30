'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/features/cart';
import { CartItemRow } from '@/features/cart/components/CartItemRow';
import { CartSummary } from '@/features/cart/components/CartSummary';
import { CartEmptyState } from '@/features/cart/components/CartEmptyState';
import { Button, Skeleton } from '@flordoestudante/ui';

export function CartPageClient() {
  const { items, hydrated, subtotal, totalItemCount, setQuantity, removeItem } = useCart();

  if (!hydrated) {
    return (
      <div className="mt-8 space-y-6 py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin shrink-0 text-primary" aria-hidden />
          <span>Carregando seu carrinho…</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <Skeleton className="h-56 rounded-lg lg:col-span-1" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <CartEmptyState />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li key={item.productId}>
              <div className="p-4">
                <CartItemRow
                  item={item}
                  onQuantityChange={setQuantity}
                  onRemove={removeItem}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
          <CartSummary
            subtotal={subtotal}
            itemCount={totalItemCount}
            cta={
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Ir para o checkout</Link>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
