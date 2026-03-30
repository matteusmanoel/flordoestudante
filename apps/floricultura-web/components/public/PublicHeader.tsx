'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { CartSheet } from '@/features/cart';
import { cn } from '@flordoestudante/utils';
import { BRAND_LOGO_SRC, STORE_NAME } from '@/lib/constants';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/assinaturas', label: 'Assinaturas' },
  { href: '/carrinho', label: 'Carrinho' },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="flex min-w-0 max-w-[min(100%,18rem)] shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90 sm:gap-3"
            aria-label={`${STORE_NAME} — início`}
          >
            <span className="relative block h-9 w-9 shrink-0 sm:h-10 sm:w-10">
              <Image
                src={BRAND_LOGO_SRC}
                alt=""
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </span>
            <span className="truncate font-serif text-base font-medium tracking-tight text-foreground sm:text-lg">
              {STORE_NAME}
            </span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {NAV_LINKS.filter((l) => l.href !== '/carrinho').map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
            <div className="flex items-center gap-2">
              <CartSheet />
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/login">Área do lojista</Link>
              </Button>
            </div>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <CartSheet />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden border-t border-border/40 bg-background transition-all md:hidden',
            mobileOpen ? 'max-h-60 py-3' : 'max-h-0 py-0'
          )}
        >
          <nav className="container flex flex-col gap-2 px-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Área do lojista
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
