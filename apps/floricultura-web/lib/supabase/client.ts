/**
 * Cliente Supabase para uso no browser (floricultura-web).
 */

import { createSupabaseBrowserClient } from '@flordoestudante/supabase';
import { getSupabaseConfig } from '@/lib/env';

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() is for browser only. Use server client in Server Components/API.');
  }
  if (!browserClient) {
    const { url, anonKey } = getSupabaseConfig();
    browserClient = createSupabaseBrowserClient({ url, anonKey });
  }
  return browserClient;
}
