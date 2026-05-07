'use client';

import Link from 'next/link';
import { Price } from '@flordoestudante/ui';
import type { ProductCardModel } from '../types';
import { cn } from '@flordoestudante/utils';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { useCart } from '@/features/cart';

type ProductCardProps = {
  product: ProductCardModel;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const rawUrl = product.coverImageUrl?.trim() || '';
  const { addItem } = useCart();

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        categoryName: product.categoryName,
        coverImageUrl: product.coverImageUrl,
        price: product.price,
      },
      1,
      undefined
    );
  }

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted/40">
        <MediaThumb
          src={rawUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.04] object-cover"
        />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="inline-flex items-center rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground backdrop-blur-sm">
              Destaque
            </span>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground backdrop-blur-sm">
              Promoção
            </span>
          )}
        </div>

        {/* Quick-add overlay */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 transition-transform duration-300 group-hover:translate-y-0">
          <span className="text-xs font-medium text-white/90 drop-shadow">Adicionar</span>
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform active:scale-90 hover:bg-primary hover:text-primary-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="editorial-label min-h-4">
          {product.categoryName || '\u00A0'}
        </p>
        <h3 className="mt-1.5 min-h-[3.25rem] line-clamp-2 font-display text-base font-medium leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          <Price
            value={product.price}
            compareAt={product.compareAtPrice}
            className="text-sm font-medium"
          />
        </div>
      </div>
    </Link>
  );
}
