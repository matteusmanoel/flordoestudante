'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@flordoestudante/utils';
import type { ProductDetailViewModel } from '../types';

const placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="%23f3f4f6"%3E%3Crect width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3EImagem%3C/text%3E%3C/svg%3E';

type ProductGalleryProps = {
  product: ProductDetailViewModel;
  className?: string;
};

function imageUrlOrDefault(url: string): string {
  const t = url?.trim() || '';
  return t && (t.startsWith('http') || t.startsWith('/')) ? t : placeholderSrc;
}

export function ProductGallery({ product, className }: ProductGalleryProps) {
  type ImageItem = { id: string; imageUrl: string; altText: string };
  const coverItem: ImageItem = { id: 'cover', imageUrl: product.coverImageUrl, altText: product.name };
  const extraItems: ImageItem[] = product.images.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    altText: img.altText ?? product.name,
  }));
  const allImages: ImageItem[] = [coverItem, ...extraItems];
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (allImages.length === 0) return null;

  const currentSelected: ImageItem = allImages[selectedIndex] ?? allImages[0]!;
  const mainUrl = imageUrlOrDefault(currentSelected.imageUrl);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
        <Image
          src={mainUrl}
          alt={currentSelected.altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          unoptimized={mainUrl.startsWith('http')}
        />
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                selectedIndex === i ? 'border-primary' : 'border-border hover:border-primary/50'
              )}
            >
              <Image
                src={imageUrlOrDefault(img.imageUrl)}
                alt={img.altText}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized={img.imageUrl.startsWith('http')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
