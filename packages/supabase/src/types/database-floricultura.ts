/**
 * Tipos do schema da floricultura (Supabase).
 * Para tipos completos gerados: cd supabase/floricultura && supabase gen types typescript --local > ../../packages/supabase/src/types/database-floricultura.ts
 * Este arquivo define apenas os tipos mínimos usados pelos helpers até a geração estar disponível.
 */

import type { AdminRole } from '@flordoestudante/core';

export interface FloriculturaAdminRow {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FloriculturaDatabase {
  public: {
    Tables: {
      admins: {
        Row: FloriculturaAdminRow;
        Insert: Omit<FloriculturaAdminRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FloriculturaAdminRow, 'id'>>;
      };
    };
  };
}
