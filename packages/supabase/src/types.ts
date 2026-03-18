/**
 * Tipos utilitários para respostas e erros Supabase.
 */

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

export function isSupabaseError(err: unknown): err is SupabaseError {
  return typeof err === 'object' && err !== null && 'message' in err;
}
