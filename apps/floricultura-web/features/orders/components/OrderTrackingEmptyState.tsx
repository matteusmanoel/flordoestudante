'use client';

import Link from 'next/link';
import { Button, Card } from '@flordoestudante/ui';

export function OrderTrackingEmptyState() {
  return (
    <Card className="mx-auto max-w-lg space-y-4 p-6 text-center">
      <p className="font-medium text-foreground">Não encontramos este pedido.</p>
      <p className="text-sm text-muted-foreground">
        Verifique se o código foi digitado corretamente. Em caso de dúvida, fale com a
        Flor do Estudante informando o código do pedido.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button asChild variant="default" size="sm">
          <Link href="/catalogo">Ver catálogo</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Início</Link>
        </Button>
      </div>
    </Card>
  );
}

