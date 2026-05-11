'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@flordoestudante/core';
import type { DashboardAttentionOrder, DashboardData } from './types';

const TEXT_MUTED = '#78716c';
const TEXT = '#44403c';
const BORDER = '#e7e5e4';
const ACCENT = '#b45309';
const ACCENT2 = '#9d174d';
const SAGE = '#4d7c6f';

function brlCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

type Props = {
  kpis: DashboardData['kpis'];
  finance: DashboardData['finance'];
  catalog: DashboardData['catalog'];
  attentionQueue: DashboardAttentionOrder[];
};

function baseChartTheme(): Pick<EChartsOption, 'textStyle' | 'tooltip'> {
  return {
    textStyle: { color: TEXT, fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: BORDER,
      textStyle: { color: TEXT },
    },
  };
}

function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function DashboardCharts({ kpis, finance, catalog, attentionQueue }: Props) {
  const pipelineBarOption = useMemo((): EChartsOption => {
    return {
      ...baseChartTheme(),
      grid: { left: '4%', right: '8%', bottom: '4%', top: '4%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: BORDER } },
        splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
        axisLabel: { color: TEXT_MUTED },
      },
      yAxis: {
        type: 'category',
        data: [
          'Pipeline aberto',
          'Em andamento',
          'Aguardando pagamento',
          'Aguardando aprovação',
        ],
        axisLine: { lineStyle: { color: BORDER } },
        axisLabel: { color: TEXT_MUTED, fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: [
            kpis.openPipeline,
            kpis.inProgress,
            kpis.pendingPayment,
            kpis.awaitingApproval,
          ],
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#fce7f3' },
                { offset: 1, color: ACCENT2 },
              ],
            },
          },
          barMaxWidth: 36,
        },
      ],
    };
  }, [kpis]);

  const financeCompareOption = useMemo((): EChartsOption => {
    const d7 = finance.last7Days;
    const d30 = finance.last30Days;
    return {
      ...baseChartTheme(),
      legend: {
        data: ['Últimos 7 dias', 'Últimos 30 dias'],
        bottom: 0,
        textStyle: { color: TEXT_MUTED },
      },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Mercado Pago (pago)', 'Compromisso na entrega/retirada', 'Pedidos concluídos (valor)'],
        axisLabel: { color: TEXT_MUTED, interval: 0, fontSize: 11, rotate: 0 },
        axisLine: { lineStyle: { color: BORDER } },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
        axisLabel: {
          color: TEXT_MUTED,
          formatter: (v: number) => brlCompact(v),
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: BORDER,
        textStyle: { color: TEXT },
        valueFormatter: (v) => (typeof v === 'number' ? brlCompact(v) : String(v)),
      },
      series: [
        {
          name: 'Últimos 7 dias',
          type: 'bar',
          data: [
            d7.mercadoPagoPaidTotal,
            d7.payOnFulfillmentCommitmentTotal,
            d7.completedTotal,
          ],
          itemStyle: { color: ACCENT, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28,
        },
        {
          name: 'Últimos 30 dias',
          type: 'bar',
          data: [
            d30.mercadoPagoPaidTotal,
            d30.payOnFulfillmentCommitmentTotal,
            d30.completedTotal,
          ],
          itemStyle: { color: SAGE, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28,
        },
      ],
    };
  }, [finance]);

  const attentionByStatusOption = useMemo((): EChartsOption | null => {
    if (attentionQueue.length === 0) return null;
    const counts = new Map<string, number>();
    for (const o of attentionQueue) {
      counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    }
    const colors = ['#be185d', '#c2410c', '#0d9488'];
    const data = [...counts.entries()].map(([status, value], i) => ({
      value,
      name: statusLabel(status),
      itemStyle: { color: colors[i % colors.length] },
    }));
    return {
      ...baseChartTheme(),
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: BORDER,
        textStyle: { color: TEXT },
      },
      legend: { bottom: 0, textStyle: { color: TEXT_MUTED } },
      series: [
        {
          type: 'pie',
          radius: ['36%', '62%'],
          center: ['50%', '44%'],
          data,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { color: TEXT_MUTED },
        },
      ],
    };
  }, [attentionQueue]);

  const catalogDonutOption = useMemo((): EChartsOption => {
    const active = catalog.productsActive;
    const inactive = catalog.productsInactive;
    const total = active + inactive;
    return {
      ...baseChartTheme(),
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: BORDER,
        textStyle: { color: TEXT },
        valueFormatter: (v) => `${v} (${total ? Math.round((Number(v) / total) * 100) : 0}%)`,
      },
      legend: {
        bottom: 0,
        textStyle: { color: TEXT_MUTED },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { color: TEXT_MUTED, fontSize: 12 },
          data: [
            { value: active, name: 'Produtos ativos', itemStyle: { color: '#d9c4b8' } },
            { value: inactive, name: 'Produtos inativos', itemStyle: { color: '#a8a29e' } },
          ],
        },
      ],
    };
  }, [catalog]);

  return (
    <section className="space-y-4" aria-label="Gráficos">
      <div>
        <h2 className="font-display text-lg font-medium text-foreground">Visão gráfica</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comparativo rápido de pedidos, valores e catálogo com base nos mesmos dados do resumo acima.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 bg-background/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-medium">Pedidos por etapa</CardTitle>
            <CardDescription>Contagem atual no pipeline (mesmos números dos cards).</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ReactECharts
              option={pipelineBarOption}
              style={{ height: 260, width: '100%' }}
              opts={{ renderer: 'svg' }}
              notMerge
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-background/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-medium">Catálogo</CardTitle>
            <CardDescription>Distribuição de produtos ativos e inativos.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ReactECharts
              option={catalogDonutOption}
              style={{ height: 260, width: '100%' }}
              opts={{ renderer: 'svg' }}
              notMerge
            />
          </CardContent>
        </Card>

        {attentionByStatusOption ? (
          <Card className="border-border/80 bg-background/80 shadow-none lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-medium">Fila de atenção (amostra)</CardTitle>
              <CardDescription>
                Distribuição por status nos últimos pedidos listados na fila (até 10).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ReactECharts
                option={attentionByStatusOption}
                style={{ height: 240, width: '100%', maxWidth: 480, margin: '0 auto' }}
                opts={{ renderer: 'svg' }}
                notMerge
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/80 bg-background/80 shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-medium">Valores por período</CardTitle>
            <CardDescription>
              Barras agrupadas: Mercado Pago (pedidos pagos criados no período), compromisso na
              entrega/retirada e valor total de pedidos concluídos no período.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ReactECharts
              option={financeCompareOption}
              style={{ height: 320, width: '100%' }}
              opts={{ renderer: 'svg' }}
              notMerge
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
