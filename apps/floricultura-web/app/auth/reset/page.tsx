import { Suspense } from 'react';
import { ResetPasswordPageClient } from './ResetPasswordPageClient';

export const metadata = {
  title: 'Redefinir senha',
  robots: { index: false, follow: false },
};

function firstString(
  value: string | string[] | undefined
): string | null {
  if (value === undefined) return null;
  return typeof value === 'string' ? value : value[0] ?? null;
}

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function ResetPasswordPage({ searchParams }: PageProps) {
  const initialAuth = {
    code: firstString(searchParams.code),
    errorCode: firstString(searchParams.error_code),
    errorDescription: firstString(searchParams.error_description),
    target: firstString(searchParams.target),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">Carregando…</p>
          }
        >
          <ResetPasswordPageClient initialAuth={initialAuth} />
        </Suspense>
      </div>
    </div>
  );
}
