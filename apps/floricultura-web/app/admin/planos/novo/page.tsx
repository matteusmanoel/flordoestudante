import { requireAdminSession } from '@/features/admin/session';
import { PlanForm } from '../PlanForm';

export default async function NovoPlanPage() {
  await requireAdminSession();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-serif text-2xl font-medium mb-6">Novo Plano de Assinatura</h1>
      <PlanForm />
    </div>
  );
}
