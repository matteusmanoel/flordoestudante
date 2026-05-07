'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ProductGrid,
  CatalogEmptyState,
  PromoProductsSection,
  ProductCardSkeleton,
} from '@/features/catalog/components';
import type { CategoryCard, ProductCardModel } from '@/features/catalog/types';

type CatalogPageClientProps = {
  initialProducts: ProductCardModel[];
  initialTotal: number;
  promoProducts: ProductCardModel[];
  categories: CategoryCard[];
  categorySlug: string | undefined;
  searchQuery: string | undefined;
};

export function CatalogPageClient({
  initialProducts,
  initialTotal,
  promoProducts,
  categories,
  categorySlug,
  searchQuery,
}: CatalogPageClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
    setLoadError(null);
  }, [initialProducts, categorySlug, searchQuery]);

  const hasMore = products.length < initialTotal;

  useEffect(() => {
    if (!hasMore || isLoadingMore || !observerRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoadingMore) return;

        setIsLoadingMore(true);
        setLoadError(null);
        try {
          const params = new URLSearchParams({
            offset: String(products.length),
            limit: '24',
          });
          if (categorySlug) params.set('categoria', categorySlug);
          if (searchQuery) params.set('q', searchQuery);

          const response = await fetch(`/api/catalog/products?${params.toString()}`, {
            method: 'GET',
            cache: 'no-store',
          });
          if (!response.ok) {
            throw new Error(`Falha ao carregar produtos (${response.status})`);
          }

          const payload = (await response.json()) as { products?: ProductCardModel[] };
          const nextProducts = payload.products ?? [];
          if (nextProducts.length > 0) {
            setProducts((current) => [...current, ...nextProducts]);
          }
        } catch {
          setLoadError('Não foi possível carregar mais produtos agora.');
        } finally {
          setIsLoadingMore(false);
        }
      },
      { rootMargin: '500px 0px' }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [categorySlug, hasMore, isLoadingMore, products.length, searchQuery]);

  const categoryName = useMemo(
    () => (categorySlug ? categories.find((c) => c.slug === categorySlug)?.name : null),
    [categories, categorySlug]
  );

  if (products.length === 0) {
    const categoryName = categorySlug
      ? categories.find((c) => c.slug === categorySlug)?.name
      : null;
    return (
      <>
        {!categorySlug && !searchQuery && promoProducts.length > 0 ? (
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
              : searchQuery
                ? `Nenhum produto encontrado para "${searchQuery}".`
                : 'Em breve teremos novidades.'
          }
        />
      </>
    );
  }

  return (
    <>
      {!categorySlug && !searchQuery && promoProducts.length > 0 ? (
        <PromoProductsSection
          products={promoProducts}
          title="Promoções"
          description="Itens com preço especial no momento."
          className="mb-12"
        />
      ) : null}
      <ProductGrid products={products} />
      <div ref={observerRef} className="h-2 w-full" aria-hidden />
      {isLoadingMore ? (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <li key={`loading-${item}`}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      ) : null}
      {loadError ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">{loadError}</div>
      ) : null}
      {!hasMore && products.length > 0 ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {categoryName
            ? `Você chegou ao final de ${categoryName}.`
            : 'Você chegou ao final do catálogo.'}
        </div>
      ) : null}
    </>
  );
}
