'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, Menu } from 'lucide-react';
import { Button } from '@flordoestudante/ui';
import { CartSheet } from '@/features/cart';
import { cn } from '@flordoestudante/utils';
import { BRAND_LOGO_SRC, STORE_NAME, STORE_WHATSAPP } from '@/lib/constants';
import type { CategoryCard } from '@/features/catalog/types';

const WHATSAPP_MSG = encodeURIComponent('Olá! Gostaria de fazer um pedido.');

const STATIC_NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/assinaturas', label: 'Assinaturas' },
];

type PublicHeaderProps = {
  categories?: CategoryCard[];
};

export function PublicHeader({ categories = [] }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/catalogo?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
  }

  function handleSearchClose() {
    setSearchOpen(false);
    setSearchQuery('');
  }

  const visibleCategories = categories.slice(0, 7);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Linha principal */}
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label={`${STORE_NAME} — início`}
          >
            <span className="relative block h-8 w-8 shrink-0 sm:h-9 sm:w-9">
              <Image
                src={BRAND_LOGO_SRC}
                alt=""
                fill
                className="object-contain"
                sizes="36px"
                priority
              />
            </span>
            <span className="truncate font-display text-sm font-medium tracking-tight text-foreground sm:text-base">
              {STORE_NAME}
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-5 md:flex">
            {STATIC_NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative pb-0.5 text-sm transition-colors',
                    active
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-active-indicator"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Ações desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
            <CartSheet />
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/admin/login">Área do lojista</Link>
            </Button>
          </div>

          {/* Ações mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
            >
              <Search className="h-4 w-4" />
            </button>
            <CartSheet />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Sub-nav de categorias — desktop */}
        {visibleCategories.length > 0 && (
          <div className="hidden border-t border-border/40 md:block">
            <div className="container px-4">
              <ul className="scrollbar-none flex gap-1 overflow-x-auto py-1.5">
                {visibleCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/catalogo?categoria=${cat.slug}`}
                      className="inline-block whitespace-nowrap rounded-md px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/catalogo"
                    className="inline-block whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    Ver todos →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Barra de busca — slide down */}
        <div
          className={cn(
            'overflow-hidden border-t border-border/40 bg-background transition-all duration-200',
            searchOpen ? 'max-h-16 py-2' : 'max-h-0 py-0'
          )}
        >
          <div className="container px-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar flores, buquês, presentes..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={handleSearchClose}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar busca"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Menu mobile */}
        <div
          className={cn(
            'overflow-hidden border-t border-border/40 bg-background transition-all duration-200 md:hidden',
            mobileOpen ? 'max-h-[80vh] py-4' : 'max-h-0 py-0'
          )}
        >
          <nav className="container flex flex-col gap-1 px-4">
            {/* Links principais */}
            {STATIC_NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted',
                    active ? 'bg-muted/60 font-medium text-foreground' : 'text-foreground'
                  )}
                >
                  {label}
                </Link>
              );
            })}

            {/* Categorias em grid 2 colunas */}
            {visibleCategories.length > 0 && (
              <div className="mt-3">
                <p className="editorial-label mb-2 px-3">Categorias</p>
                <div className="grid grid-cols-2 gap-2">
                  {visibleCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/catalogo?categoria=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/catalogo"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 block rounded-lg px-3 py-2 text-sm font-medium text-primary"
                >
                  Ver todo o catálogo →
                </Link>
              </div>
            )}

            {/* WhatsApp */}
            <div className="mt-3 border-t border-border/40 pt-3">
              <a
                href={`https://wa.me/${STORE_WHATSAPP}?text=${WHATSAPP_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg className="h-4 w-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar pelo WhatsApp
              </a>
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Área do lojista
              </Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
