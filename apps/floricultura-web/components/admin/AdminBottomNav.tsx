'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@flordoestudante/utils';
import { LayoutDashboard, ShoppingBag, Package, ImageIcon, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { signOutAdmin } from '@/features/admin/sign-out-action';

const mainItems = [
  { href: '/admin', label: 'Início', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
] as const;

const moreLinks = [
  { href: '/admin/produtos/import', label: 'Importar planilha' },
  { href: '/admin/planos', label: 'Planos' },
  { href: '/admin/complementos', label: 'Complementos' },
  { href: '/', label: 'Ver site público' },
] as const;

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Navegação do painel"
    >
      <div className="flex h-14 items-stretch justify-around">
        {mainItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground'
              )}
            >
              <Menu className="h-5 w-5" />
              Mais
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Mais opções</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-col gap-2">
              {moreLinks.map((l) => (
                <Button key={l.href} variant="ghost" className="justify-start" asChild>
                  <Link href={l.href}>{l.label}</Link>
                </Button>
              ))}
              <form action={signOutAdmin} className="pt-2">
                <Button type="submit" variant="outline" className="w-full">
                  Sair
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
