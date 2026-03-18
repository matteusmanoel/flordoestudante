'use client';

import Link from 'next/link';
import { Button } from '@flordoestudante/ui';

type CartEmptyStateProps = {
  onClose?: () => void;
};

export function CartEmptyState({ onClose }: CartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground">Seu carrinho está vazio.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Navegue pelo catálogo e adicione itens para continuar.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" size="sm" onClick={onClose}>
          <Link href="/catalogo">Ver catálogo</Link>
        </Button>
        <Button asChild size="sm" onClick={onClose}>
          <Link href="/">Início</Link>
        </Button>
      </div>
    </div>
  );
}
