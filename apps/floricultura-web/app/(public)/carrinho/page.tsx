import Link from 'next/link';
import { CartPageClient } from './CartPageClient';
import { Button } from '@flordoestudante/ui';

export const metadata = {
  title: 'Carrinho — Flor do Estudante',
  description: 'Revise seus itens e prossiga para o checkout.',
};

export default function CartPage() {
  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/catalogo">← Voltar ao catálogo</Link>
          </Button>
        </div>
        <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
          Carrinho
        </h1>
        <CartPageClient />
      </div>
    </div>
  );
}
