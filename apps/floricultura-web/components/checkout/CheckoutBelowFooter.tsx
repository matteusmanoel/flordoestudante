'use client';

import { usePathname } from 'next/navigation';
import { useCart } from '@/features/cart/store';
import { CheckoutRecommendedSection } from '@/features/checkout/components/CheckoutRecommendedSection';

/**
 * "Complete seu presente" abaixo do rodapé do site, só em /checkout com itens no carrinho.
 */
export function CheckoutBelowFooter() {
  const pathname = usePathname();
  const { items, hydrated } = useCart();

  if (!pathname?.startsWith('/checkout')) return null;
  if (!hydrated || items.length === 0) return null;

  return <CheckoutRecommendedSection variant="quickAdd" />;
}
