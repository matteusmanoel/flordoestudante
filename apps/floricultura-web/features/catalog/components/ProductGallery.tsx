'use client';

import { useState, useEffect } from 'react';
import { cn } from '@flordoestudante/utils';
import type { ProductDetailViewModel } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';

type ProductGalleryProps = {
  product: ProductDetailViewModel;
  className?: string;
};

export function ProductGallery({ product, className }: ProductGalleryProps) {
  type ImageItem = { id: string; imageUrl: string; altText: string };

  const coverTrimmed = (product.coverImageUrl ?? '').trim();
  const coverItem: ImageItem = {
    id: 'cover',
    imageUrl: coverTrimmed,
    altText: product.name,
  };

  const extraItems: ImageItem[] = product.images.map((img) => ({
    id: img.id,
    imageUrl: (img.imageUrl ?? '').trim(),
    altText: img.altText ?? product.name,
  }));

  const merged: ImageItem[] = [
    ...(coverTrimmed.length > 0 ? [coverItem] : []),
    ...extraItems,
  ].filter((img) => img.imageUrl.length > 0);
  
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allImages = merged;

  useEffect(() => {
    setSelectedIndex(0);
  }, [product.id]);

  if (allImages.length === 0) {
    // Se não há imagens, retornar um placeholder
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
          <MediaThumb
            src=""
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    );
  }

  const currentSelected: ImageItem = allImages[selectedIndex] ?? allImages[0]!;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Imagem principal */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
        <MediaThumb
          src={currentSelected.imageUrl}
          alt={currentSelected.altText}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          imageClassName="transition-opacity duration-300"
        />
        {/* Indicador de posição em mobile */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
            {allImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                aria-label={`Imagem ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === selectedIndex ? 'w-5 bg-primary' : 'w-1.5 bg-white/60'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — visíveis apenas se houver mais de 1 imagem */}
      {allImages.length > 1 && (
        <div className="scrollbar-none hidden gap-2 overflow-x-auto pb-1 sm:flex">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className={cn(
                'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                selectedIndex === i
                  ? 'border-primary shadow-md shadow-primary/20'
                  : 'border-border/50 opacity-70 hover:border-primary/40 hover:opacity-100'
              )}
            >
              <MediaThumb src={img.imageUrl} alt={img.altText} fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
