import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { BRAND_LOGO_SRC, STORE_NAME } from '@/lib/constants';

const CONTACT_TILE =
  'flex flex-col items-center justify-center gap-1 rounded-lg border border-border/50 bg-background/30 px-2 py-2 text-center text-[11px] font-medium leading-tight text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground sm:text-xs';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container max-w-6xl px-4 py-5 sm:py-6">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:gap-y-0">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="group inline-flex max-w-full items-start gap-3 opacity-95 transition-opacity hover:opacity-100 sm:gap-3.5"
              aria-label={STORE_NAME}
            >
              <span className="relative mt-0.5 block h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                <Image
                  src={BRAND_LOGO_SRC}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="44px"
                />
              </span>
              <span className="flex min-w-0 flex-col gap-1 pt-0.5">
                <span className="font-serif text-base leading-none tracking-tight text-foreground sm:text-[1.05rem]">
                  {STORE_NAME}
                </span>
                <span className="font-serif text-[0.8125rem] leading-snug text-muted-foreground sm:max-w-[16rem]">
                  Flores e presentes com carinho.
                </span>
              </span>
            </Link>
          </div>

          <nav
            className="flex flex-wrap gap-x-4 gap-y-1 border-border/60 font-serif text-[0.8125rem] text-muted-foreground sm:gap-x-5 lg:col-span-3 lg:border-l lg:pl-6"
            aria-label="Navegação do rodapé"
          >
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
            <Link href="/admin/login" className="transition-colors hover:text-foreground">
              Área do lojista
            </Link>
          </nav>

          <div className="lg:col-span-5">
            <p className="mb-2 font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Contato
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5">
              <a
                href="https://wa.me/554598418755"
                target="_blank"
                rel="noopener noreferrer"
                className={CONTACT_TILE}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span>WhatsApp Floricultura</span>
              </a>
              <a
                href="https://wa.me/554598207212"
                target="_blank"
                rel="noopener noreferrer"
                className={CONTACT_TILE}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span>WhatsApp Home Decor</span>
              </a>
              <a
                href="https://www.facebook.com/flordoestudante/"
                target="_blank"
                rel="noopener noreferrer"
                className={CONTACT_TILE}
              >
                <Facebook className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/floriculturaflordoestudante/"
                target="_blank"
                rel="noopener noreferrer"
                className={CONTACT_TILE}
              >
                <Instagram className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span>Instagram Floricultura</span>
              </a>
              <a
                href="https://www.instagram.com/flordoestudante_home/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${CONTACT_TILE} col-span-2 sm:col-span-1 lg:col-span-1`}
              >
                <Instagram className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span>Instagram Home Decor</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
