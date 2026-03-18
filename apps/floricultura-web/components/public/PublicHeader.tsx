'use client';

import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { CartSheet, CartToast } from '@/features/cart';

export function PublicHeader() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="font-serif text-lg font-medium text-foreground transition-colors hover:text-primary"
          >
            Flor do Estudante
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Início
            </Link>
            <Link
              href="/catalogo"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Catálogo
            </Link>
            <div className="flex items-center">
              <CartSheet />
            </div>
            <Button asChild size="sm" variant="default">
              <Link href="/admin/login">Área do lojista</Link>
            </Button>
          </nav>
        </div>
      </header>
      <CartToast />
    </>
  );
}
