'use client';

import { ProductGrid, CatalogEmptyState } from '@/features/catalog/components';
import type { CategoryCard, ProductCardModel } from '@/features/catalog/types';

type CatalogPageClientProps = {
  products: ProductCardModel[];
  categories: CategoryCard[];
  categorySlug: string | undefined;
};

export function CatalogPageClient({
  products,
  categories,
  categorySlug,
}: CatalogPageClientProps) {
  if (products.length === 0) {
    const categoryName = categorySlug
      ? categories.find((c) => c.slug === categorySlug)?.name
      : null;
    return (
      <CatalogEmptyState
        title={categoryName ? `Nenhum produto em ${categoryName}` : 'Nenhum produto no momento'}
        description={
          categoryName
            ? 'Tente outra categoria ou volte ao catálogo completo.'
            : 'Em breve teremos novidades.'
        }
      />
    );
  }

  return <ProductGrid products={products} />;
}
