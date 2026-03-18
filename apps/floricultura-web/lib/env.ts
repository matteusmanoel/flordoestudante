/**
 * Variáveis de ambiente do app floricultura-web.
 * Centraliza leitura e evita process.env espalhado.
 * NEXT_PUBLIC_* são disponíveis no client (inlined em build).
 */

export const env = {
  get supabaseUrl(): string | undefined {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  },
  get supabaseAnonKey(): string | undefined {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },
  get siteUrl(): string | undefined {
    return process.env.NEXT_PUBLIC_SITE_URL;
  },
} as const;

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = env.supabaseUrl;
  const anonKey = env.supabaseAnonKey;
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return { url, anonKey };
}
