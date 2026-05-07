/**
 * Solicita o e-mail de redefinição de senha via Supabase Auth.
 * POST /api/auth/reset-request
 * Body: { email: string, target?: 'admin' | 'customer' }
 *
 * Importante: por privacidade, sempre devolve 200 mesmo quando o e-mail não existe.
 */

import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server-service';

export const runtime = 'nodejs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResetTarget = 'admin' | 'customer';

function parseBody(value: unknown):
  | { email: string; target: ResetTarget }
  | { error: string } {
  if (!value || typeof value !== 'object') {
    return { error: 'Dados inválidos.' };
  }
  const raw = value as Record<string, unknown>;
  const emailRaw = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(emailRaw)) {
    return { error: 'Informe um e-mail válido.' };
  }
  const target: ResetTarget = raw.target === 'admin' ? 'admin' : 'customer';
  return { email: emailRaw, target };
}

function getRedirectBase(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'https://flordoestudante-floricultura-web.vercel.app';
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 });
  }

  const parsed = parseBody(payload);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email, target } = parsed;
  const base = getRedirectBase(request);
  const redirectTo = `${base}/auth/reset?target=${target}`;

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      console.error('[auth/reset-request]', error.message);
    }
  } catch (err) {
    console.error('[auth/reset-request] unexpected', err);
  }

  return NextResponse.json({
    ok: true,
    message:
      'Se houver uma conta com este e-mail, enviaremos um link para redefinir a senha em instantes.',
  });
}
