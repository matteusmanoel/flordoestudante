'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { cn } from '@flordoestudante/utils';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@flordoestudante/ui';
import { AdminBottomNav } from './AdminBottomNav';
import { signOutAdmin } from '@/features/admin/sign-out-action';

const desktopNav = [
  { href: '/admin', label: 'Início' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/produtos/import', label: 'Importar' },
  { href: '/admin/banners', label: 'Banners' },
  { href: '/admin/planos', label: 'Planos' },
  { href: '/admin/complementos', label: 'Complementos' },
] as const;

export function AdminShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const signOutFormRef = useRef<HTMLFormElement>(null);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-4">
            <Link href="/admin" className="font-serif text-lg font-medium text-foreground">
              Painel administrativo
            </Link>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-40 hidden border-b border-border bg-background md:block">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="shrink-0 font-serif text-lg font-medium text-foreground">
            Painel
          </Link>
          <nav className="flex flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-1 px-2 text-sm">
            {desktopNav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap transition-colors hover:text-foreground',
                  pathname === href || (href !== '/admin' && pathname.startsWith(href))
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" target="_blank" rel="noreferrer">
                Site
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                  Conta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/admin/produtos/import">Importar planilha</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    signOutFormRef.current?.requestSubmit();
                  }}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <form ref={signOutFormRef} action={signOutAdmin} className="hidden" aria-hidden>
              <button type="submit" tabIndex={-1} />
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-16 md:pb-0">{children}</div>

      <AdminBottomNav />
    </div>
  );
}
