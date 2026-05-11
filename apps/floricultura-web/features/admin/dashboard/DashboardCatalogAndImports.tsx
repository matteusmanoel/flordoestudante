import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { formatDateTime } from '@flordoestudante/utils';
import type { DashboardData, DashboardImportRow } from './types';

function importStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    running: 'Em execução',
    completed: 'Concluída',
    failed: 'Falhou',
  };
  return map[status] ?? status;
}

function LastImportBlock({ row }: { row: DashboardImportRow | null }) {
  if (!row) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma importação registrada ainda.{' '}
        <Link href="/admin/produtos/import" className="text-primary underline-offset-4 hover:underline">
          Importar planilha
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4 text-sm">
      <p className="font-medium text-foreground">{row.file_name}</p>
      <p className="mt-2 text-muted-foreground">
        Status: <span className="text-foreground">{importStatusLabel(row.status)}</span>
        {' · '}
        OK: {row.imported_rows} · Falhas: {row.failed_rows}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {row.finished_at ? `Finalizada ${formatDateTime(row.finished_at)}` : `Registrada ${formatDateTime(row.created_at)}`}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href="/admin/produtos/import">Ver importações</Link>
      </Button>
    </div>
  );
}

type Props = {
  catalog: DashboardData['catalog'];
  lastImport: DashboardData['lastImport'];
};

export function DashboardCatalogAndImports({ catalog, lastImport }: Props) {
  return (
    <Card className="border-border/80 bg-background/80 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl font-medium">Catálogo e importações</CardTitle>
        <CardDescription>Visão rápida do cadastro de produtos e da última planilha processada.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Produtos</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex justify-between gap-4">
              <span>Ativos</span>
              <span className="tabular-nums text-foreground">{catalog.productsActive}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Inativos</span>
              <span className="tabular-nums text-foreground">{catalog.productsInactive}</span>
            </li>
          </ul>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/produtos">Gerenciar produtos</Link>
          </Button>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Última importação</p>
          <LastImportBlock row={lastImport} />
        </div>
      </CardContent>
    </Card>
  );
}
