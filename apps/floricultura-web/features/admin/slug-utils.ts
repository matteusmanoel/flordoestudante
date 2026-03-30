import { slugify } from '@flordoestudante/utils';
import type { createServerSupabaseClient } from '@/lib/supabase/server';

type SB = ReturnType<typeof createServerSupabaseClient>;

export function slugFromName(name: string): string {
  const s = slugify(name.trim());
  return s || 'item';
}

export async function ensureUniqueSlug(
  supabase: SB,
  table: 'products' | 'subscription_plans' | 'addons',
  base: string,
  excludeId?: string
): Promise<string> {
  let candidate = base || 'item';
  let n = 0;
  for (;;) {
    const { data: row } = await supabase.from(table).select('id').eq('slug', candidate).maybeSingle();
    if (!row) return candidate;
    if (excludeId && row.id === excludeId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
