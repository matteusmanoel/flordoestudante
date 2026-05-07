'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button, Price } from '@flordoestudante/ui';
import type { ProductCardModel } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { useCart } from '@/features/cart';

type CompleteSeuPresenteProps = {
  products: ProductCardModel[];
  title?: string;
  className?: string;
  /** `navigate`: abre a página do produto. `quickAdd`: adiciona 1 unidade ao carrinho no checkout. */
  variant?: 'navigate' | 'quickAdd';
};

export function CompleteSeuPresente({
  products,
  title = 'Complete seu presente',
  className,
  variant = 'navigate',
}: CompleteSeuPresenteProps) {
  const { addItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  if (!products.length) return null;

  function scrollToCheckoutTop() {
    const anchor = document.getElementById('checkout-page-top');
    const run = () => {
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    // Mobile Safari / layout após setState: dois frames ajuda o scroll a aplicar.
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  }

  function handleQuickAdd(product: ProductCardModel) {
    setAddingId(product.id);
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
      { openCartSheet: false }
    );
    scrollToCheckoutTop();
    setAddingId(null);
  }

  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-medium text-foreground">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => {
          const rawUrl = product.coverImageUrl?.trim() || '';
          const busy = addingId === product.id;

          if (variant === 'quickAdd') {
            return (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                <Link
                  href={`/produto/${product.slug}`}
                  className="group relative block aspect-square overflow-hidden bg-muted/50"
                >
                  <MediaThumb
                    src={rawUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link
                    href={`/produto/${product.slug}`}
                    className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <Price
                    value={product.price}
                    compareAt={product.compareAtPrice}
                    size="sm"
                    className="mt-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2"
                    disabled={busy}
                    onClick={() => handleQuickAdd(product)}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Adicionando…
                      </>
                    ) : (
                      'Adicionar ao pedido'
                    )}
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={product.id}
              href={`/produto/${product.slug}`}
              className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-muted/50">
                <MediaThumb
                  src={rawUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                  {product.name}
                </h3>
                <Price value={product.price} compareAt={product.compareAtPrice} size="sm" className="mt-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
