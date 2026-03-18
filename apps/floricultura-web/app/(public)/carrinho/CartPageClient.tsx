'use client';

import Link from 'next/link';
import { useCart } from '@/features/cart';
import { CartItemRow } from '@/features/cart/components/CartItemRow';
import { CartSummary } from '@/features/cart/components/CartSummary';
import { CartEmptyState } from '@/features/cart/components/CartEmptyState';
import { Button } from '@flordoestudante/ui';

export function CartPageClient() {
  const { items, hydrated, subtotal, totalItemCount, setQuantity, removeItem } = useCart();

  if (!hydrated) {
    return (
      <div className="mt-8 flex justify-center py-12">
        <p className="text-muted-foreground">Carregando carrinho...</p>
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
