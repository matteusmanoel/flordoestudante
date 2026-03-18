/**
 * Cliente Supabase para uso no server (floricultura-web).
 * Usa anon key por padrão; API routes que precisem de service role devem criar cliente próprio.
 */

import { createSupabaseServerClient } from '@flordoestudante/supabase';

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return createSupabaseServerClient({
    url,
    anonKey,
    serviceRoleKey,
  });
}
