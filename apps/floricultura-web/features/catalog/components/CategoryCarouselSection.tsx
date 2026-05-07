import Link from 'next/link';
import type { CategoryCard, ProductCardModel } from '../types';
import { CategoryCarousel } from './CategoryCarousel';

type CategoryCarouselSectionProps = {
  category: CategoryCard;
  products: ProductCardModel[];
};

export function CategoryCarouselSection({ category, products }: CategoryCarouselSectionProps) {
  if (products.length === 0) return null;

  return (
    <div className="relative overflow-hidden px-4 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="editorial-label">{products.length} produtos</p>
          <h3 className="mt-0.5 font-display text-xl font-medium text-foreground sm:text-2xl">
            {category.name}
          </h3>
        </div>
        <Link
          href={`/catalogo?categoria=${category.slug}`}
          className="shrink-0 text-sm text-primary underline-offset-4 hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      <CategoryCarousel products={products} />
    </div>
  );
}
