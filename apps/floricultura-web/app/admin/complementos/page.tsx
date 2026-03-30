import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrency } from '@flordoestudante/utils';
import { Badge, Button } from '@flordoestudante/ui';
import Link from 'next/link';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { ToggleAddonButton } from './ToggleAddonButton';
import { AdminAddonsClient } from './AdminAddonsClient';
import { AdminAddonsMobileCards, type AdminAddonListRow } from '@/components/admin/list';

export default async function AdminComplementosPage() {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();

  const { data: addons } = await supabase
    .from('addons')
    .select('*')
    .order('sort_order', { ascending: true });

  const addonRows: AdminAddonListRow[] = (addons ?? []).map((addon: Record<string, unknown>) => ({
    id: String(addon.id),
    name: String(addon.name),
    addon_category: String(addon.addon_category),
    price: Number(addon.price),
    cover_image_url: (addon.cover_image_url as string | null) ?? null,
    is_active: Boolean(addon.is_active),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium">Complementos</h1>
        <AdminAddonsClient />
      </div>

      <div className="md:hidden">
        <AdminAddonsMobileCards addons={addonRows} />
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Imagem</th>
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Categoria</th>
              <th className="px-4 py-3 text-right font-medium">Preço</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(addons ?? []).map((addon: Record<string, unknown>) => (
              <tr key={String(addon.id)} className="hover:bg-muted/30">
                <td className="px-4 py-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
                    <MediaThumb
                      src={(addon.cover_image_url as string | null) ?? null}
                      alt={String(addon.name)}
                      fill
                      sizes="48px"
                      imageClassName="object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{String(addon.name)}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{String(addon.addon_category)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(Number(addon.price))}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={addon.is_active ? 'default' : 'secondary'}>
                    {addon.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/complementos/${addon.id}`}>Editar</Link>
                    </Button>
                    <ToggleAddonButton id={String(addon.id)} isActive={Boolean(addon.is_active)} />
                  </div>
                </td>
              </tr>
            ))}
            {(!addons || addons.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum complemento cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
