import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AdminAddonEditClient } from '../AdminAddonEditClient';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditAddonPage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: addon, error } = await supabase.from('addons').select('*').eq('id', id).single();
  if (error || !addon) notFound();

  return (
    <div className="p-6">
      <AdminAddonEditClient addon={addon as Parameters<typeof AdminAddonEditClient>[0]['addon']} />
    </div>
  );
}
