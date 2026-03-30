'use client';

import { useState } from 'react';
import { cn } from '@flordoestudante/utils';
import type { ProductDetailViewModel } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';

type ProductGalleryProps = {
  product: ProductDetailViewModel;
  className?: string;
};

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

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
        <MediaThumb
          src={currentSelected.imageUrl}
          alt={currentSelected.altText}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
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
              <MediaThumb src={img.imageUrl} alt={img.altText} fill sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
