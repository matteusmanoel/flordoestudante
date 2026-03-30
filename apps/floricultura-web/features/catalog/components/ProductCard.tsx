'use client';

import Link from 'next/link';
import { Price } from '@flordoestudante/ui';
import type { ProductCardModel } from '../types';
import { cn } from '@flordoestudante/utils';
import { MediaThumb } from '@/components/shared/MediaThumb';

type ProductCardProps = {
  product: ProductCardModel;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const rawUrl = product.coverImageUrl?.trim() || '';

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
        <MediaThumb
          src={rawUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {product.isFeatured && (
          <span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Destaque
          </span>
        )}
      </div>
      <div className="p-4">
        {product.categoryName && (
          <p className="text-xs text-muted-foreground">{product.categoryName}</p>
        )}
        <h3 className="mt-1 font-serif text-lg font-medium text-foreground group-hover:text-primary">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-3">
          <Price
            value={product.price}
            compareAt={product.compareAtPrice}
            className="text-base font-medium"
          />
        </div>
      </div>
    </Link>
  );
}
