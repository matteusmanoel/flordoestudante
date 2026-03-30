import { AdminShell } from '@/components/admin/AdminShell';
import { getOptionalAdminSession } from '@/features/admin/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin } = await getOptionalAdminSession();

  return <AdminShell isAdmin={!!admin}>{children}</AdminShell>;
}
