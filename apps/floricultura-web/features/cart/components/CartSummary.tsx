'use client';

import { formatCurrency } from '@flordoestudante/utils';

type CartSummaryProps = {
  subtotal: number;
  itemCount: number;
  cta?: React.ReactNode;
};

export function CartSummary({ subtotal, itemCount, cta }: CartSummaryProps) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </span>
        <span className="font-medium text-foreground">
          {formatCurrency(subtotal, { currency: 'BRL', locale: 'pt-BR' })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Frete e descontos serão calculados no checkout.
      </p>
      {cta && <div className="pt-2">{cta}</div>}
    </div>
  );
}
