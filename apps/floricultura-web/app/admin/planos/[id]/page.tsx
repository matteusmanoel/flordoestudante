import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AdminPlanEditClient } from '../AdminPlanEditClient';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPlanPage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: plan, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !plan) notFound();

  return (
    <div className="p-6">
      <AdminPlanEditClient plan={plan as Parameters<typeof AdminPlanEditClient>[0]['plan']} />
    </div>
  );
}
