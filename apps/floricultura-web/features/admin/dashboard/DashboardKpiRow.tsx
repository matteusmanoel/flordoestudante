import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@flordoestudante/ui';
import type { DashboardData } from './types';

type Props = {
  kpis: DashboardData['kpis'];
};

export function DashboardKpiRow({ kpis }: Props) {
  const items = [
    {
      label: 'Aguardando aprovação',
      value: kpis.awaitingApproval,
      href: '/admin/pedidos',
      hint: 'Pedidos para decidir',
    },
    {
      label: 'Aguardando pagamento',
      value: kpis.pendingPayment,
      href: '/admin/pedidos',
      hint: 'Checkout / link de pagamento',
    },
    {
      label: 'Em andamento',
      value: kpis.inProgress,
      href: '/admin/pedidos',
      hint: 'Produção, retirada ou rota',
    },
    {
      label: 'Pipeline aberto',
      value: kpis.openPipeline,
      href: '/admin/pedidos',
      hint: 'Todos os pedidos em aberto',
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="block transition-opacity hover:opacity-90">
          <Card className="h-full border-border/80 bg-background/80 shadow-none">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-normal text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-5 pt-0">
              <p className="font-display text-3xl font-medium tabular-nums text-foreground">{item.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
