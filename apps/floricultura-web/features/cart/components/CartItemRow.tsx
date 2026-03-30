'use client';

import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { CartItem as CartItemType } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';

type CartItemRowProps = {
  item: CartItemType;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  imageUrl?: string;
};

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  imageUrl,
}: CartItemRowProps) {
  const thumbSrc = imageUrl ?? item.imageUrl;

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <Link href={`/produto/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <MediaThumb src={thumbSrc} alt={item.name} fill sizes="80px" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/produto/${item.slug}`} className="font-medium text-foreground hover:text-primary line-clamp-2">
          {item.name}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatCurrency(item.unitPrice, { currency: 'BRL', locale: 'pt-BR' })} × {item.quantity}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              onClick={() => onQuantityChange(item.productId, Math.max(1, item.quantity - 1))}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.productId, Math.min(99, item.quantity + 1))}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.productId)}
          >
            Remover
          </Button>
        </div>
      </div>
      <div className="shrink-0 text-right font-medium text-foreground">
        {formatCurrency(item.lineTotal, { currency: 'BRL', locale: 'pt-BR' })}
      </div>
    </div>
  );
}
