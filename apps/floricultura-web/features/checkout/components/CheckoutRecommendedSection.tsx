'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
import { useCart } from '@/features/cart/store';
import { CompleteSeuPresente } from '@/features/catalog/components';
import type { ProductCardModel } from '@/features/catalog/types';
import { getRecommendedForCheckoutAction } from '../get-recommended-action';

type CheckoutRecommendedSectionProps = {
  /** `quickAdd`: adiciona ao carrinho com um clique (checkout abaixo do rodapé). */
  variant?: 'link' | 'quickAdd';
};

function QuickAddGridSkeleton() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-52 max-w-[70%] rounded-md" />
        <Skeleton className="h-8 w-24 shrink-0 rounded-md" />
      </div>
      <div className="grid min-h-[18.5rem] grid-cols-2 gap-4 sm:min-h-[19.5rem] sm:grid-cols-3 md:min-h-[20.5rem] md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-[16.75rem] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:min-h-[17.25rem]"
          >
            <Skeleton className="aspect-square w-full shrink-0 rounded-none" />
            <div className="flex flex-1 flex-col gap-2 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="mt-auto h-4 w-20" />
              <Skeleton className="mt-3 h-9 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CheckoutRecommendedSection({ variant = 'link' }: CheckoutRecommendedSectionProps) {
  const { items } = useCart();
  const [products, setProducts] = useState<ProductCardModel[]>([]);
  const [loading, setLoading] = useState(true);

  const productIds = items.map((i) => i.productId);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getRecommendedForCheckoutAction(productIds)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productIds.join(',')]);

  if (variant === 'quickAdd') {
    if (!loading && products.length === 0) return null;

    return (
      <section
        className="w-full min-h-[24rem] border-t border-border bg-muted/25 py-10 sm:min-h-[25rem] sm:py-12"
        aria-label="Sugestões para seu pedido"
      >
        {loading && products.length === 0 ? <QuickAddGridSkeleton /> : null}
        {products.length > 0 ? (
          <div
            className={cn(
              'transition-opacity duration-200',
              loading && products.length > 0 && 'opacity-70'
            )}
          >
            <CompleteSeuPresente
              products={products}
              title="Complete seu presente"
              variant="quickAdd"
            />
          </div>
        ) : null}
      </section>
    );
  }

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <CompleteSeuPresente
        products={products}
        title="Complete seu presente"
        variant="navigate"
      />
    </div>
  );
}

