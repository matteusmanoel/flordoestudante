/**
 * Factory do cliente Supabase para uso no server (Node/Next server).
 * Use service role key apenas em ambiente seguro (server).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseServerClient = SupabaseClient;

/**
 * Cria cliente Supabase para o server (com service role key quando disponível).
 */
export function createSupabaseServerClient(options: {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}): SupabaseServerClient {
  const { url, anonKey, serviceRoleKey } = options;
  if (!url || !anonKey) {
    throw new Error('Supabase url and anonKey are required for server client.');
  }
  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
