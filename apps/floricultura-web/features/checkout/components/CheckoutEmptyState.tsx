'use client';

import Link from 'next/link';
import { Button } from '@flordoestudante/ui';

export function CheckoutEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
      <p className="font-medium text-foreground">Seu carrinho está vazio</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Adicione itens ao carrinho para finalizar seu pedido.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="default">
          <Link href="/catalogo">Ver catálogo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
