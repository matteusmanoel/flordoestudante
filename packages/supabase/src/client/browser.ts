/**
 * Factory do cliente Supabase para uso no browser.
 * O app deve fornecer url e anonKey (env ou config).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseBrowserClient = SupabaseClient;

/**
 * Cria cliente Supabase para o browser.
 */
export function createSupabaseBrowserClient(options: {
  url: string;
  anonKey: string;
}): SupabaseBrowserClient {
  const { url, anonKey } = options;
  if (!url || !anonKey) {
    throw new Error('Supabase url and anonKey are required for browser client.');
  }
  return createClient(url, anonKey);
}
