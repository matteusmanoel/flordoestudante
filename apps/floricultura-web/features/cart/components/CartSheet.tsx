'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@flordoestudante/ui';
import { acquireCartBodyScrollLock, releaseCartBodyScrollLock } from '../body-scroll-lock';
import { useCart } from '../store';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { CartEmptyState } from './CartEmptyState';

export function CartSheet() {
  const {
    items,
    hydrated,
    subtotal,
    totalItemCount,
    setQuantity,
    removeItem,
    cartSheetOpen,
    setCartSheetOpen,
  } = useCart();
  const isEmpty = items.length === 0;

  // SSR-safe: mount portal only on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Bloqueia scroll (iOS); ref-count: há dois CartSheet no header — sem isso o 2º cleanup “restaura” para fixed.
  useEffect(() => {
    if (!cartSheetOpen) return;
    acquireCartBodyScrollLock();
    return () => {
      releaseCartBodyScrollLock();
    };
  }, [cartSheetOpen]);

  const panel = (
    <AnimatePresence>
      {cartSheetOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={() => setCartSheetOpen(false)}
            className="fixed inset-0 z-50 min-h-[100dvh] overscroll-none bg-black/30 touch-none"
            aria-hidden="true"
          />

          {/* Painel — só translateX (GPU); sem blur no overlay nem opacity no painel para evitar travadas */}
          <motion.div
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho de compras"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: 'transform' }}
            className="fixed z-[51] flex w-full max-w-[100vw] flex-col border-l border-border bg-background shadow-2xl overscroll-none max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:max-w-md"
          >
            <div className="flex h-full min-h-0 max-h-full flex-col gap-4 overflow-hidden overscroll-none p-6 max-sm:h-[100dvh] max-sm:max-h-[100dvh]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold leading-none">Carrinho</h2>
                <button
                  type="button"
                  onClick={() => setCartSheetOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Fechar carrinho"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {isEmpty ? (
                  <CartEmptyState onClose={() => setCartSheetOpen(false)} />
                ) : (
                  <>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 touch-pan-y">
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
                          <Button
                            asChild
                            className="w-full rounded-full"
                            onClick={() => setCartSheetOpen(false)}
                          >
                            <Link href="/checkout">Finalizar pedido</Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full rounded-full"
                            onClick={() => setCartSheetOpen(false)}
                          >
                            <Link href="/catalogo">Ver catálogo</Link>
                          </Button>
                        </div>
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setCartSheetOpen(true)}
        className="relative flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Carrinho com ${totalItemCount} ${totalItemCount === 1 ? 'item' : 'itens'}`}
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

      {/* Portal */}
      {mounted && createPortal(panel, document.body)}
    </>
  );
}
