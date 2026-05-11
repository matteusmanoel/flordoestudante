'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button, Price } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
import type { ProductCardModel } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { useCart } from '@/features/cart';

type CompleteSeuPresenteProps = {
  products: ProductCardModel[];
  title?: string;
  className?: string;
  /**
   * `quickAdd` (checkout): adiciona sem abrir o sheet do carrinho.
   * `navigate` (PDP, etc.): mesmo card com overlay “Adicionar” do catálogo; clique fora do botão vai ao produto.
   */
  variant?: 'navigate' | 'quickAdd';
};

const MAX_VISIBLE_ITEMS = 4;

/** Altura mínima estável da grade (evita pulo ao recarregar sugestões / adicionar item). */
const QUICK_ADD_GRID_MIN_H =
  'min-h-[18.5rem] sm:min-h-[19.5rem] md:min-h-[20.5rem]' as const;
const QUICK_ADD_CARD_MIN_H = 'min-h-[16.75rem] sm:min-h-[17.25rem]' as const;

function pickRandomProducts(products: ProductCardModel[], count: number): ProductCardModel[] {
  if (products.length <= count) return products;
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const itemI = shuffled[i];
    const itemJ = shuffled[j];
    if (!itemI || !itemJ) continue;
    shuffled[i] = itemJ;
    shuffled[j] = itemI;
  }
  return shuffled.slice(0, count);
}

export function CompleteSeuPresente({
  products,
  title = 'Complete seu presente',
  className,
  variant = 'navigate',
}: CompleteSeuPresenteProps) {
  const { addItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [visibleProducts, setVisibleProducts] = useState<ProductCardModel[]>(
    products.slice(0, MAX_VISIBLE_ITEMS)
  );

  useEffect(() => {
    setVisibleProducts(products.slice(0, MAX_VISIBLE_ITEMS));
  }, [products]);

  if (!products.length) return null;

  const canRandomize = products.length > MAX_VISIBLE_ITEMS;

  function handleQuickAdd(e: React.MouseEvent, product: ProductCardModel) {
    e.preventDefault();
    e.stopPropagation();
    setAddingId(product.id);
    queueMicrotask(() => {
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
        undefined,
        variant === 'quickAdd' ? { openCartSheet: false } : undefined
      );
      setAddingId(null);
    });
  }

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-medium text-foreground">{title}</h2>
        {canRandomize ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVisibleProducts(pickRandomProducts(products, MAX_VISIBLE_ITEMS))}
          >
            Atualizar
          </Button>
        ) : null}
      </div>
      <div
        className={
          variant === 'quickAdd'
            ? `grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 ${QUICK_ADD_GRID_MIN_H}`
            : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'
        }
      >
        {visibleProducts.map((product) => {
          const rawUrl = product.coverImageUrl?.trim() || '';
          const busy = addingId === product.id;

          return (
            <Link
              key={product.id}
              href={`/produto/${product.slug}`}
              className={cn(
                'group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/8',
                variant === 'quickAdd' && QUICK_ADD_CARD_MIN_H
              )}
            >
              <div className="relative aspect-square shrink-0 overflow-hidden bg-muted/40">
                <MediaThumb
                  src={rawUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  imageClassName="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  showLoadingSkeleton={variant === 'quickAdd'}
                />
                <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 transition-transform duration-300 group-hover:translate-y-0">
                  <span className="text-xs font-medium text-white/90 drop-shadow">Adicionar</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(e) => handleQuickAdd(e, product)}
                    aria-label={`Adicionar ${product.name} ao carrinho`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform active:scale-90 hover:bg-primary hover:text-primary-foreground disabled:opacity-70"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <h3 className="min-h-[2.5rem] line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {product.name}
                </h3>
                <Price
                  value={product.price}
                  compareAt={product.compareAtPrice}
                  size="sm"
                  className="mt-auto pt-1"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
