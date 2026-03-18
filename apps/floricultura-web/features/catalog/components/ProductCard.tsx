'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Price } from '@flordoestudante/ui';
import type { ProductCardModel } from '../types';
import { cn } from '@flordoestudante/utils';

const placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="%23e5e7eb"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EProduto%3C/text%3E%3C/svg%3E';

type ProductCardProps = {
  product: ProductCardModel;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const rawUrl = product.coverImageUrl?.trim() || '';
  const imageUrl = rawUrl && (rawUrl.startsWith('http') || rawUrl.startsWith('/')) ? rawUrl : placeholderSrc;
  const isExternalImage = imageUrl.startsWith('http');

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={isExternalImage}
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
