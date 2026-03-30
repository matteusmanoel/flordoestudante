import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrency } from '@flordoestudante/utils';
import { Badge, Button } from '@flordoestudante/ui';
import Link from 'next/link';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { AdminProductsClient } from './AdminProductsClient';
import { AdminProductsMobileCards, type AdminProductListRow } from '@/components/admin/list';

function normalizeCategory(
  raw: unknown
): { name: string } | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && typeof first === 'object' && 'name' in first) {
      return { name: String((first as { name: unknown }).name) };
    }
    return null;
  }
  if (typeof raw === 'object' && raw !== null && 'name' in raw) {
    return { name: String((raw as { name: unknown }).name) };
  }
  return null;
}

export default async function AdminProdutosPage() {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, cover_image_url, is_active, is_featured, categories(name)')
    .order('name', { ascending: true });

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  const { data: addons } = await supabase
    .from('addons')
    .select('id, name, price')
    .eq('is_active', true)
    .order('sort_order');

  const productRows: AdminProductListRow[] = (products ?? []).map((p: Record<string, unknown>) => ({
    id: String(p.id),
    name: String(p.name),
    price: Number(p.price),
    cover_image_url: (p.cover_image_url as string | null) ?? null,
    is_active: Boolean(p.is_active),
    categories: normalizeCategory(p.categories),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium">Produtos</h1>
        <AdminProductsClient
          categories={categories ?? []}
          addons={addons ?? []}
          products={products ?? []}
        />
      </div>

      <div className="md:hidden">
        <AdminProductsMobileCards products={productRows} />
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Imagem</th>
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-right font-medium">Preço</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p: Record<string, unknown>) => (
              <tr key={String(p.id)} className="hover:bg-muted/30">
                <td className="px-4 py-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
                    <MediaThumb
                      src={p.cover_image_url as string | null}
                      alt={String(p.name)}
                      fill
                      sizes="48px"
                      imageClassName="object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{String(p.name)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(Number(p.price))}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={p.is_active ? 'default' : 'secondary'}>
                    {p.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/produtos/${p.id}`}>Editar</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado. Clique em &quot;Novo produto&quot; para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
