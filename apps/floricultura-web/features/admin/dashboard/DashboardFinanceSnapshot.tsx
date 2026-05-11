import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import type { DashboardPeriodMoney } from './types';

function PeriodBlock({
  title,
  period,
}: {
  title: string;
  period: DashboardPeriodMoney;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Mercado Pago (pedidos pagos, criados no período)</dt>
          <dd className="mt-1 font-display text-lg font-medium tabular-nums text-foreground">
            {formatCurrency(period.mercadoPagoPaidTotal)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Compromisso na entrega / retirada (criados no período, exceto rascunho/cancelado/expirado)</dt>
          <dd className="mt-1 font-display text-lg font-medium tabular-nums text-foreground">
            {formatCurrency(period.payOnFulfillmentCommitmentTotal)}
          </dd>
        </div>
        <div className="border-t border-border/50 pt-4">
          <dt className="text-muted-foreground">Pedidos concluídos (no período por data de conclusão)</dt>
          <dd className="mt-1 tabular-nums text-foreground">
            <span className="font-medium">{period.completedCount}</span>
            {' · '}
            <span className="font-display font-medium">{formatCurrency(period.completedTotal)}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

type Props = {
  last7Days: DashboardPeriodMoney;
  last30Days: DashboardPeriodMoney;
};

export function DashboardFinanceSnapshot({ last7Days, last30Days }: Props) {
  return (
    <Card className="border-border/80 bg-background/80 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl font-medium">Resumo financeiro</CardTitle>
        <CardDescription>
          Valores aproximados para operação diária; Mercado Pago reflete pedidos com pagamento confirmado criados na
          janela. &quot;Compromisso&quot; inclui pagar na entrega ou na retirada e não equivale a caixa recebido.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <PeriodBlock title="Últimos 7 dias" period={last7Days} />
        <PeriodBlock title="Últimos 30 dias" period={last30Days} />
      </CardContent>
    </Card>
  );
}
