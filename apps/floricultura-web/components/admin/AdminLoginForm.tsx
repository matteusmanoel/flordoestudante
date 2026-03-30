'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { Input } from '@flordoestudante/ui';
import { Label } from '@flordoestudante/ui';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { BRAND_LOGO_SRC, STORE_NAME } from '@/lib/constants';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forbidden = searchParams.get('error') === 'forbidden';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    forbidden ? 'Usuário sem permissão de lojista. Confira a tabela admins no Supabase.' : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }
    const supabase = createBrowserClient(url, anonKey);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signErr) {
      setError(signErr.message);
      setLoading(false);
      return;
    }
    router.refresh();
    router.push('/admin');
  }

  return (
    <Card className="mx-auto w-full max-w-md">
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
          <p className="font-serif text-sm font-medium text-muted-foreground">{STORE_NAME}</p>
        </div>
        <CardTitle className="font-serif text-2xl">Área do lojista</CardTitle>
        <CardDescription>
          Entre com o e-mail cadastrado no Supabase Auth e vinculado à tabela{' '}
          <code className="text-xs">admins</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
            />
          </div>
          <Button
            className="inline-flex w-full items-center justify-center gap-2"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline hover:text-foreground">
              Voltar ao site
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
