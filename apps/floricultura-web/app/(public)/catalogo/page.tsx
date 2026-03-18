import { Suspense } from 'react';
import { getCategories, getProducts } from '@/features/catalog/data';
import {
  CategoryChip,
  CatalogSection,
  ProductCardSkeleton,
} from '@/features/catalog/components';
import { CatalogPageClient } from './CatalogPageClient';

export const metadata = {
  title: 'Catálogo — Flor do Estudante',
  description: 'Flores, buquês e presentes. Navegue por categorias e encontre o presente ideal.',
};

type PageProps = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categorySlug = params.categoria ?? undefined;
  const [categories, { products, total }] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug, limit: 50 }),
  ]);

  const allCategory = {
    id: '',
    name: 'Todos',
    slug: '',
    description: null,
    imageUrl: null,
    productCount: total,
  };

  return (
    <div className="min-h-screen">
      <CatalogSection
        title="Catálogo"
        description="Flores, buquês e cestas para todos os momentos."
      >
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <CategoryChip
            category={allCategory}
            isActive={!categorySlug}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isActive={categorySlug === cat.slug}
            />
          ))}
        </div>
        <Suspense fallback={<CatalogPageSkeleton />}>
          <CatalogPageClient
            products={products}
            categories={categories}
            categorySlug={categorySlug}
          />
        </Suspense>
      </CatalogSection>
    </div>
  );
}

function CatalogPageSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
