'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flordoestudante/ui';
import { Loader2, Mail, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BRAND_LOGO_SRC, STORE_NAME } from '@/lib/constants';

type Target = 'admin' | 'customer';

export type ResetInitialAuth = {
  code: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  target: string | null;
};

function isAdminTarget(value: string | null): Target {
  return value === 'admin' ? 'admin' : 'customer';
}

function targetCopy(target: Target) {
  if (target === 'admin') {
    return {
      title: 'Recuperar acesso da loja',
      description:
        'Informe o e-mail vinculado à conta de lojista para receber o link de redefinição.',
      backHref: '/admin/login',
      backLabel: 'Voltar ao login do lojista',
      successHref: '/admin',
      successLabel: 'Ir para o painel',
    };
  }
  return {
    title: 'Redefinir minha senha',
    description:
      'Informe o e-mail da sua conta para receber o link de redefinição de senha.',
    backHref: '/',
    backLabel: 'Voltar à loja',
    successHref: '/',
    successLabel: 'Ir para a loja',
  };
}

function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase não configurado.');
  }
  return createBrowserClient(url, anonKey);
}

function hasRecoveryTokensInHash(hash: string): boolean {
  return (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('type=recovery')
  );
}

export function ResetPasswordPageClient({
  initialAuth,
}: {
  initialAuth: ResetInitialAuth;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = isAdminTarget(initialAuth.target ?? searchParams.get('target'));
  const code = initialAuth.code ?? searchParams.get('code');
  const errorCode = initialAuth.errorCode ?? searchParams.get('error_code');
  const errorDescription =
    initialAuth.errorDescription ?? searchParams.get('error_description');
  const [hasRecoveryHash, setHasRecoveryHash] = useState(false);
  const [hashChecked, setHashChecked] = useState(false);

  const copy = useMemo(() => targetCopy(target), [target]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHasRecoveryHash(hasRecoveryTokensInHash(window.location.hash));
    setHashChecked(true);
  }, []);

  if (errorCode || errorDescription) {
    return (
      <ResetErrorState
        copy={copy}
        title="Link inválido ou expirado"
        message={
          errorDescription
            ? decodeURIComponent(errorDescription).replace(/\+/g, ' ')
            : 'Solicite um novo link e tente novamente.'
        }
      />
    );
  }

  if (!hashChecked && !code) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <ResetHeader copy={copy} />
        <CardContent className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          Validando link…
        </CardContent>
      </Card>
    );
  }

  if (code || hasRecoveryHash) {
    return <NewPasswordStep code={code} copy={copy} router={router} />;
  }

  return <RequestEmailStep target={target} copy={copy} />;
}

type Copy = ReturnType<typeof targetCopy>;

function ResetHeader({ copy }: { copy: Copy }) {
  return (
    <CardHeader className="space-y-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-14 w-14">
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            fill
            className="object-contain"
            sizes="56px"
          />
        </div>
        <p className="font-serif text-sm font-medium text-muted-foreground">
          {STORE_NAME}
        </p>
      </div>
      <CardTitle className="font-serif text-2xl">{copy.title}</CardTitle>
      <CardDescription>{copy.description}</CardDescription>
    </CardHeader>
  );
}

function RequestEmailStep({ target, copy }: { target: Target; copy: Copy }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), target }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(json.error ?? 'Não foi possível enviar o e-mail agora.');
        setLoading(false);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível enviar o e-mail agora.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <ResetHeader copy={copy} />
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
              <Mail className="h-6 w-6" aria-hidden />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Verifique seu e-mail</p>
              <p className="text-sm text-muted-foreground">
                Se houver uma conta para <strong>{email.trim()}</strong>, enviaremos o
                link de redefinição em instantes. Confira também a pasta de spam.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={copy.backHref}>{copy.backLabel}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Enviando link…
                </>
              ) : (
                'Enviar link de redefinição'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href={copy.backHref} className="underline hover:text-foreground">
                {copy.backLabel}
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function NewPasswordStep({
  code,
  copy,
  router,
}: {
  code: string | null;
  copy: Copy;
  router: ReturnType<typeof useRouter>;
}) {
  const [exchanging, setExchanging] = useState(true);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data: afterInit, error: initErr } = await supabase.auth.getSession();
        if (cancelled) return;
        if (afterInit.session?.user && !initErr) {
          return;
        }
        if (!code) {
          setExchangeError(
            initErr?.message ||
              'Link inválido ou expirado. Solicite um novo e tente novamente.'
          );
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          setExchangeError(
            error.message ||
              'Link inválido ou expirado. Solicite um novo e tente novamente.'
          );
        }
      } catch (err) {
        if (cancelled) return;
        setExchangeError(
          err instanceof Error ? err.message : 'Não foi possível validar o link.'
        );
      } finally {
        if (!cancelled) setExchanging(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (password.length < 8) {
      setSubmitError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setSubmitError('As senhas não conferem.');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      setDone(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Não foi possível atualizar a senha.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (exchanging) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <ResetHeader copy={copy} />
        <CardContent className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          Validando link…
        </CardContent>
      </Card>
    );
  }

  if (exchangeError) {
    return (
      <ResetErrorState
        copy={copy}
        title="Link inválido ou expirado"
        message={exchangeError}
      />
    );
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <ResetHeader copy={copy} />
        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <p className="font-medium text-foreground">Senha redefinida com sucesso</p>
          <p className="text-sm text-muted-foreground">
            Você já está autenticado. Continue navegando ou acesse o painel.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              router.refresh();
              router.push(copy.successHref);
            }}
          >
            {copy.successLabel}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <ResetHeader copy={copy} />
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {submitError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
                Definir nova senha
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetErrorState({
  copy,
  title,
  message,
}: {
  copy: Copy;
  title: string;
  message: string;
}) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <ResetHeader copy={copy} />
      <CardContent className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/auth/reset?target=${copy.backHref.includes('admin') ? 'admin' : 'customer'}`}>
              Solicitar novo link
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={copy.backHref}>{copy.backLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
