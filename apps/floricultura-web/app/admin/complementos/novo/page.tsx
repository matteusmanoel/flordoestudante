import { requireAdminSession } from '@/features/admin/session';
import { AddonForm } from '../AddonForm';

export default async function NovoAddonPage() {
  await requireAdminSession();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-serif text-2xl font-medium mb-6">Novo Complemento</h1>
      <AddonForm />
    </div>
  );
}
