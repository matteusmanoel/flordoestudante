'use client';

import { ProductCard } from './ProductCard';
import type { ProductCardModel } from '../types';

type ProductGridProps = {
  products: ProductCardModel[];
  className?: string;
};

export function ProductGrid({ products, className }: ProductGridProps) {
  if (products.length === 0) return null;
  return (
    <ul className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className ?? ''}`}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
