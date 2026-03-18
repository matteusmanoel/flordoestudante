import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-sm text-muted-foreground">
            Flor do Estudante — Flores e presentes com carinho.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Início
            </Link>
            <Link href="/catalogo" className="transition-colors hover:text-foreground">
              Catálogo
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
          </div>
        </div>
      </div>
    </footer>
  );
}
