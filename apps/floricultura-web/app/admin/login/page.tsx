import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Carregando…</p>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
