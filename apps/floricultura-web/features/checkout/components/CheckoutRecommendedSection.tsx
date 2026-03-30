'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/features/cart/store';
import { CompleteSeuPresente } from '@/features/catalog/components';
import type { ProductCardModel } from '@/features/catalog/types';
import { getRecommendedForCheckoutAction } from '../get-recommended-action';

type CheckoutRecommendedSectionProps = {
  /** `quickAdd`: adiciona ao carrinho com um clique (checkout abaixo do rodapé). */
  variant?: 'link' | 'quickAdd';
};

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

  if (loading || products.length === 0) return null;

  const body = (
    <CompleteSeuPresente
      products={products}
      title="Complete seu presente"
      variant={variant === 'quickAdd' ? 'quickAdd' : 'navigate'}
    />
  );

  if (variant === 'quickAdd') {
    return (
      <section
        className="border-t border-border bg-muted/25 py-10 sm:py-12"
        aria-label="Sugestões para seu pedido"
      >
        <div className="container px-4">{body}</div>
      </section>
    );
  }

  return <div className="mt-8 border-t border-border pt-6">{body}</div>;
}
