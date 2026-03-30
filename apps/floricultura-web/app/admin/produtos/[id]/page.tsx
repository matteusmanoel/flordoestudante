import { notFound } from 'next/navigation';
import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminProductEditClient } from '../AdminProductEditClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductEditPage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(
      'id, name, slug, price, compare_at_price, cover_image_url, category_id, short_description, description, is_active, is_featured, product_kind'
    )
    .eq('id', id)
    .single();

  if (productError || !product) notFound();

  const { data: productAddons } = await supabase
    .from('product_addons')
    .select('addon_id')
    .eq('product_id', id)
    .order('sort_order');
  const addon_ids = (productAddons ?? []).map((r: { addon_id: string }) => r.addon_id);

  const { data: recommendations } = await supabase
    .from('product_recommendations')
    .select('recommended_product_id')
    .eq('product_id', id)
    .order('sort_order');
  const recommended_product_ids = (recommendations ?? []).map(
    (r: { recommended_product_id: string }) => r.recommended_product_id
  );

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

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true });

  const productData = {
    ...product,
    addon_ids,
    recommended_product_ids,
  };

  return (
    <div className="p-6">
      <AdminProductEditClient
        product={productData}
        categories={categories ?? []}
        addons={addons ?? []}
        products={(products ?? []).filter((p: { id: string }) => p.id !== id)}
      />
    </div>
  );
}
