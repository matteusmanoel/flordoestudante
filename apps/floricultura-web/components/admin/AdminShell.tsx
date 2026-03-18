'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@flordoestudante/utils';

const navItems = [
  { href: '/admin', label: 'Início' },
  { href: '/admin/login', label: 'Entrar' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex h-14 items-center gap-6 px-4">
          <Link
            href="/admin"
            className="font-serif text-lg font-medium text-foreground"
          >
            Flor do Estudante — Admin
          </Link>
          <nav className="flex gap-4">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-sm transition-colors hover:text-foreground',
                  pathname === href ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar ao site
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
