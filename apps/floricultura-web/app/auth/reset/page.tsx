import { Suspense } from 'react';
import { ResetPasswordPageClient } from './ResetPasswordPageClient';

export const metadata = {
  title: 'Redefinir senha',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">Carregando…</p>
          }
        >
          <ResetPasswordPageClient />
        </Suspense>
      </div>
    </div>
  );
}
