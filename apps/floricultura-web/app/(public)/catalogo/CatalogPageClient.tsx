'use client';

import {
  ProductGrid,
  CatalogEmptyState,
  PromoProductsSection,
} from '@/features/catalog/components';
import type { CategoryCard, ProductCardModel } from '@/features/catalog/types';

type CatalogPageClientProps = {
  products: ProductCardModel[];
  promoProducts: ProductCardModel[];
  categories: CategoryCard[];
  categorySlug: string | undefined;
};

export function CatalogPageClient({
  products,
  promoProducts,
  categories,
  categorySlug,
}: CatalogPageClientProps) {
  if (products.length === 0) {
    const categoryName = categorySlug
      ? categories.find((c) => c.slug === categorySlug)?.name
      : null;
    return (
      <>
        {!categorySlug && promoProducts.length > 0 ? (
          <PromoProductsSection
            products={promoProducts}
            title="Promoções"
            description="Itens com preço especial no momento."
            className="mb-12"
          />
        ) : null}
        <CatalogEmptyState
          title={categoryName ? `Nenhum produto em ${categoryName}` : 'Nenhum produto no momento'}
          description={
            categoryName
              ? 'Tente outra categoria ou volte ao catálogo completo.'
              : 'Em breve teremos novidades.'
          }
        />
      </>
    );
  }

  return (
    <>
      {!categorySlug && promoProducts.length > 0 ? (
        <PromoProductsSection
          products={promoProducts}
          title="Promoções"
          description="Itens com preço especial no momento."
          className="mb-12"
        />
      ) : null}
      <ProductGrid products={products} />
    </>
  );
}
