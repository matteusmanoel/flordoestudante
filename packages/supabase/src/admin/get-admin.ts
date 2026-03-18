/**
 * Obtém o perfil admin pelo auth user id (Supabase Auth uid).
 * Usado no painel admin para validar sessão e carregar perfil.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FloriculturaAdminRow } from '../types/database-floricultura';

export async function getAdminByAuthUserId(
  client: SupabaseClient,
  authUserId: string
): Promise<FloriculturaAdminRow | null> {
  const { data, error } = await client
    .from('admins')
    .select('*')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return null;
  return data as FloriculturaAdminRow | null;
}
