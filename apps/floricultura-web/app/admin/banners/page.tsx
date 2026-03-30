import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminBannersView, type BannerRow } from './AdminBannersView';

export default async function AdminBannersPage() {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { data: banners } = await supabase
    .from('banners')
    .select('id, title, subtitle, image_url, cta_label, cta_href, is_active, sort_order')
    .order('sort_order', { ascending: true });

  return <AdminBannersView banners={(banners ?? []) as BannerRow[]} />;
}
