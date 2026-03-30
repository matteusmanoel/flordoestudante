import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_FREQUENCY_LABELS } from '@flordoestudante/core';
import { formatCurrency } from '@flordoestudante/utils';
import { Badge, Button } from '@flordoestudante/ui';
import Link from 'next/link';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { TogglePlanButton } from './TogglePlanButton';
import { AdminPlansClient } from './AdminPlansClient';
import { AdminPlansMobileCards, type AdminPlanListRow } from '@/components/admin/list';

export default async function AdminPlanosPage() {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true });

  const planRows: AdminPlanListRow[] = (plans ?? []).map((plan: Record<string, unknown>) => ({
    id: String(plan.id),
    name: String(plan.name),
    frequency: String(plan.frequency),
    price: Number(plan.price),
    cover_image_url: (plan.cover_image_url as string | null) ?? null,
    is_active: Boolean(plan.is_active),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium">Planos de Assinatura</h1>
        <AdminPlansClient />
      </div>

      <div className="md:hidden">
        <AdminPlansMobileCards plans={planRows} />
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Imagem</th>
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Frequência</th>
              <th className="px-4 py-3 text-right font-medium">Preço</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(plans ?? []).map((plan: Record<string, unknown>) => (
              <tr key={String(plan.id)} className="hover:bg-muted/30">
                <td className="px-4 py-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
                    <MediaThumb
                      src={(plan.cover_image_url as string | null) ?? null}
                      alt={String(plan.name)}
                      fill
                      sizes="48px"
                      imageClassName="object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{String(plan.name)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {SUBSCRIPTION_FREQUENCY_LABELS[plan.frequency as keyof typeof SUBSCRIPTION_FREQUENCY_LABELS] ?? String(plan.frequency)}
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(Number(plan.price))}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/planos/${plan.id}`}>Editar</Link>
                    </Button>
                    <TogglePlanButton id={String(plan.id)} isActive={Boolean(plan.is_active)} />
                  </div>
                </td>
              </tr>
            ))}
            {(!plans || plans.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum plano cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
