import Image from 'next/image';
import Link from 'next/link';
import { BRAND_LOGO_SRC, STORE_NAME } from '@/lib/constants';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/"
              className="group flex max-w-md items-start gap-3 opacity-95 transition-opacity hover:opacity-100 sm:items-center sm:gap-4"
              aria-label={STORE_NAME}
            >
              <span className="relative mt-0.5 block h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <Image
                  src={BRAND_LOGO_SRC}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              </span>
              <span className="font-serif text-sm leading-snug text-muted-foreground">
                <span className="text-foreground">{STORE_NAME}</span>
                {' — '}
                Flores e presentes com carinho.
              </span>
            </Link>
          </div>
          <nav className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Início
            </Link>
            <Link href="/catalogo" className="transition-colors hover:text-foreground">
              Catálogo
            </Link>
            <Link href="/assinaturas" className="transition-colors hover:text-foreground">
              Assinaturas
            </Link>
            <Link href="/carrinho" className="transition-colors hover:text-foreground">
              Carrinho
            </Link>
            <Link
              href="/admin/login"
              className="transition-colors hover:text-foreground"
            >
              Área do lojista
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
