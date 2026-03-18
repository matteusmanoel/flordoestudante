'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { CartItem as CartItemType } from '../types';

const placeholderImg =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="%23f3f4f6"%3E%3Crect width="80" height="80"/%3E%3C/svg%3E';

type CartItemRowProps = {
  item: CartItemType;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  imageUrl?: string;
};

function resolveImageUrl(url: string): string {
  const t = url?.trim() || '';
  return t && (t.startsWith('http') || t.startsWith('/')) ? t : placeholderImg;
}

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  imageUrl,
}: CartItemRowProps) {
  const imgSrc = resolveImageUrl(imageUrl ?? item.imageUrl);

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <Link href={`/produto/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={imgSrc}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized={imgSrc.startsWith('http')}
        />
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
