'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerAnon } from '@/lib/supabase/server-anon';

export async function signOutAdmin() {
  const supabase = await createSupabaseServerAnon();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
