'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { useCart } from '../store';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { CartEmptyState } from './CartEmptyState';

export function CartSheet() {
  const [open, setOpen] = useState(false);
  const { items, hydrated, subtotal, totalItemCount, setQuantity, removeItem } = useCart();
  const isEmpty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Carrinho com ${totalItemCount} itens`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {hydrated && totalItemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {totalItemCount > 99 ? '99+' : totalItemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif">Carrinho</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-hidden">
          {isEmpty ? (
            <CartEmptyState onClose={() => setOpen(false)} />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onQuantityChange={setQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              <CartSummary
                subtotal={subtotal}
                itemCount={totalItemCount}
                cta={
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full" onClick={() => setOpen(false)}>
                      <Link href="/checkout">Finalizar pedido</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
                      <Link href="/carrinho">Ver carrinho</Link>
                    </Button>
                  </div>
                }
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
