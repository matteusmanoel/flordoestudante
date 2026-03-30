import { getAdminByAuthUserId } from '@flordoestudante/supabase';
import { redirect } from 'next/navigation';
import { createSupabaseServerAnon } from '@/lib/supabase/server-anon';
import type { FloriculturaAdminRow } from '@flordoestudante/supabase';
import type { User } from '@supabase/supabase-js';

export type AdminSession = {
  user: User;
  admin: FloriculturaAdminRow;
};

export async function getOptionalAdminSession(): Promise<{
  user: User | null;
  admin: FloriculturaAdminRow | null;
}> {
  try {
    const supabase = await createSupabaseServerAnon();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user: null, admin: null };
    const admin = await getAdminByAuthUserId(supabase, user.id);
    return { user, admin: admin ?? null };
  } catch {
    return { user: null, admin: null };
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const { user, admin } = await getOptionalAdminSession();
  if (!user || !admin) {
    redirect('/admin/login');
  }
  return { user, admin };
}
