import { requireAdminSession } from '@/features/admin/session';
import { AdminProductsImportClient } from '@/components/admin/AdminProductsImportClient';

export default async function AdminProductsImportPage() {
  await requireAdminSession();

  return <AdminProductsImportClient />;
}
