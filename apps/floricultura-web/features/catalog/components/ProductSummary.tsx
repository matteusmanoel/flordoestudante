'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Price } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import { useCart } from '@/features/cart';
import type { ProductDetailViewModel } from '../types';

type ProductSummaryProps = {
  product: ProductDetailViewModel;
  className?: string;
};

export function ProductSummary({ product, className }: ProductSummaryProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAddToCart = () => {
    setAdding(true);
    window.setTimeout(() => {
      addItem(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryName: product.categoryName,
          coverImageUrl: product.coverImageUrl,
          price: product.price,
        },
        quantity
      );
      setAdding(false);
    }, 0);
  };

  return (
    <div className={className}>
      <Link
        href={`/catalogo?categoria=${product.categorySlug}`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        {product.categoryName || 'Catálogo'}
      </Link>
      <h1 className="mt-1 font-serif text-2xl font-medium text-foreground sm:text-3xl">
        {product.name}
      </h1>
      {product.shortDescription && (
        <p className="mt-2 text-muted-foreground">{product.shortDescription}</p>
      )}
      <div className="mt-4 space-y-1">
        <Price
          value={product.price}
          compareAt={product.compareAtPrice}
          size="lg"
        />
        <p className="text-sm text-muted-foreground">
          Subtotal ({quantity} {quantity === 1 ? 'item' : 'itens'}):{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(product.price * quantity, { currency: 'BRL', locale: 'pt-BR' })}
          </span>
        </p>
      </div>
      {product.description && (
        <div className="mt-6 border-t border-border pt-6">
          <h2 className="font-serif text-lg font-medium text-foreground">Descrição</h2>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>
      )}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <label htmlFor="pdp-quantity" className="text-sm text-muted-foreground">
            Quantidade
          </label>
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              id="pdp-quantity-minus"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:bg-muted"
            >
              −
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:bg-muted"
            >
              +
            </button>
          </div>
        </div>
        <Button
          size="lg"
          className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          disabled={adding}
          onClick={handleAddToCart}
        >
          {adding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Adicionando…
            </>
          ) : (
            'Adicionar ao carrinho'
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Você pode revisar e finalizar no carrinho.
        </p>
      </div>
    </div>
  );
}
