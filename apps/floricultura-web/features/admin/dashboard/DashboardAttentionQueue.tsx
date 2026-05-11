import Link from 'next/link';
import { Badge } from '@flordoestudante/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@flordoestudante/core';
import { formatCurrency, formatDateTime } from '@flordoestudante/utils';
import type { DashboardAttentionOrder } from './types';

type Props = {
  orders: DashboardAttentionOrder[];
};

function labelFor(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function DashboardAttentionQueue({ orders }: Props) {
  return (
    <Card className="border-border/80 bg-background/80 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl font-medium">Precisa da sua atenção</CardTitle>
        <CardDescription>
          Aprovação, pagamento pendente ou pago aguardando triagem — os mais recentes primeiro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido nessa fila no momento.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {o.public_code}
                    </Link>
                    <Badge variant="secondary" className="font-normal">
                      {labelFor(o.status)}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {[o.customer_name, o.customer_phone].filter(Boolean).join(' · ') || 'Cliente'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(Number.parseFloat(o.total_amount) || 0)}
                  </span>
                  <Link href={`/admin/pedidos/${o.id}`} className="text-xs text-primary hover:underline">
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
