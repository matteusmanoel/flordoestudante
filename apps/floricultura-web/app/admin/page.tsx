import dynamic from 'next/dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@flordoestudante/ui';
import { Card, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { getOptionalAdminSession, requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadDashboardData } from '@/features/admin/dashboard/load-dashboard-data';
import { DashboardKpiRow } from '@/features/admin/dashboard/DashboardKpiRow';
import { DashboardAttentionQueue } from '@/features/admin/dashboard/DashboardAttentionQueue';
import { DashboardFinanceSnapshot } from '@/features/admin/dashboard/DashboardFinanceSnapshot';
import { DashboardCatalogAndImports } from '@/features/admin/dashboard/DashboardCatalogAndImports';
const DashboardCharts = dynamic(
  () =>
    import('@/features/admin/dashboard/DashboardCharts').then((m) => ({
      default: m.DashboardCharts,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Carregando gráficos…
      </p>
    ),
  }
);
import {
  ShoppingBag,
  Package,
  FileSpreadsheet,
  Image as ImageIcon,
  Stars,
  Gift,
  Globe2,
} from 'lucide-react';

export default async function AdminHomePage() {
  const { user, admin } = await getOptionalAdminSession();

  if (user && !admin) {
    redirect('/admin/login?error=forbidden');
  }

  if (!admin) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="font-serif text-2xl font-medium text-foreground">Painel administrativo</h1>
        <p className="text-muted-foreground">
          Faça login com uma conta vinculada em <code className="text-xs">public.admins</code>.
        </p>
        <Button asChild>
          <Link href="/admin/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  await requireAdminSession();
  const sb = createServerSupabaseClient();
  const dashboard = await loadDashboardData(sb);

  const adminCards = [
    {
      title: 'Pedidos',
      description: 'Acompanhe pedidos em aberto, atualize status e veja detalhes',
      href: '/admin/pedidos',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Produtos',
      description: 'Gerencie produtos, categorias e fotos do catálogo',
      href: '/admin/produtos',
      icon: Package,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Importar por planilha',
      description: 'Suba uma planilha para cadastrar vários produtos de uma vez',
      href: '/admin/produtos/import',
      icon: FileSpreadsheet,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Banners',
      description: 'Gerencie banners da home e destaques do catálogo',
      href: '/admin/banners',
      icon: ImageIcon,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Planos de assinatura',
      description: 'Configure planos recorrentes e benefícios',
      href: '/admin/planos',
      icon: Stars,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Complementos',
      description: 'Gerencie complementos e adicionais para assinaturas',
      href: '/admin/complementos',
      icon: Gift,
      color: 'text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">Olá, {admin.full_name}</h1>
        <p className="mt-2 text-muted-foreground">
          Visão geral da operação e atalhos para o que você usa com mais frequência.
        </p>
      </div>

      {!dashboard.ok ? (
        <p className="text-destructive">Erro ao carregar o painel: {dashboard.error}</p>
      ) : (
        <>
          <section className="space-y-4" aria-label="Indicadores">
            <h2 className="font-display text-lg font-medium text-foreground">Hoje em números</h2>
            <DashboardKpiRow kpis={dashboard.data.kpis} />
          </section>

          <DashboardCharts
            kpis={dashboard.data.kpis}
            finance={dashboard.data.finance}
            catalog={dashboard.data.catalog}
            attentionQueue={dashboard.data.attentionQueue}
          />

          <section aria-label="Fila de pedidos">
            <DashboardAttentionQueue orders={dashboard.data.attentionQueue} />
          </section>

          <section aria-label="Resumo financeiro">
            <DashboardFinanceSnapshot
              last7Days={dashboard.data.finance.last7Days}
              last30Days={dashboard.data.finance.last30Days}
            />
          </section>

          <section aria-label="Catálogo">
            <DashboardCatalogAndImports
              catalog={dashboard.data.catalog}
              lastImport={dashboard.data.lastImport}
            />
          </section>
        </>
      )}

      <section className="space-y-4" aria-label="Acesso rápido">
        <h2 className="font-display text-lg font-medium text-foreground">Acesso rápido</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="transition-all hover:border-primary hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2 text-lg">{card.title}</CardTitle>
                        <CardDescription className="text-sm">{card.description}</CardDescription>
                      </div>
                      <Icon className={`h-8 w-8 flex-shrink-0 ${card.color}`} />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/" target="_blank" rel="noreferrer">
            <Globe2 className="mr-2 h-4 w-4" />
            Ver site público
          </Link>
        </Button>
      </div>
    </div>
  );
}
