'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUniqueSlug, slugFromName } from './slug-utils';
import { requireAdminSession } from './session';

function parseBool(formData: FormData, key: string): boolean {
  return formData.getAll(key).includes('true');
}

export async function upsertSubscriptionPlan(formData: FormData) {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const id = formData.get('id') as string | null;
  const name = (formData.get('name') as string).trim();
  const coverImageUrl = (formData.get('cover_image_url') as string)?.trim() || null;

  let slug: string;
  if (id) {
    const { data: existing, error: selErr } = await supabase
      .from('subscription_plans')
      .select('slug')
      .eq('id', id)
      .single();
    if (selErr || !existing) {
      return { success: false, message: 'Plano não encontrado.' };
    }
    slug = (existing as { slug: string }).slug;
  } else {
    const base = slugFromName(name);
    slug = await ensureUniqueSlug(supabase, 'subscription_plans', base);
  }

  const payload = {
    name,
    slug,
    short_description: (formData.get('short_description') as string)?.trim() || null,
    description: (formData.get('description') as string)?.trim() || null,
    cover_image_url: coverImageUrl,
    price: Number(formData.get('price')),
    frequency: formData.get('frequency') as string,
    is_active: parseBool(formData, 'is_active'),
    is_featured: parseBool(formData, 'is_featured'),
    sort_order: Number(formData.get('sort_order') || 0),
  };

  if (id) {
    const { error } = await supabase.from('subscription_plans').update(payload).eq('id', id);
    if (error) return { success: false, message: error.message };
  } else {
    const { error } = await supabase.from('subscription_plans').insert(payload);
    if (error) return { success: false, message: error.message };
  }

  revalidatePath('/admin/planos');
  revalidatePath('/assinaturas');
  return { success: true };
}

export async function togglePlanActive(id: string, isActive: boolean) {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('subscription_plans').update({ is_active: !isActive }).eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/admin/planos');
  revalidatePath('/assinaturas');
  return { success: true };
}

export async function upsertAddon(formData: FormData) {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const id = formData.get('id') as string | null;
  const name = (formData.get('name') as string).trim();
  const coverImageUrl = (formData.get('cover_image_url') as string)?.trim() || null;

  let slug: string;
  if (id) {
    const { data: existing, error: selErr } = await supabase.from('addons').select('slug').eq('id', id).single();
    if (selErr || !existing) {
      return { success: false, message: 'Complemento não encontrado.' };
    }
    slug = (existing as { slug: string }).slug;
  } else {
    const base = slugFromName(name);
    slug = await ensureUniqueSlug(supabase, 'addons', base);
  }

  const payload = {
    name,
    slug,
    description: (formData.get('description') as string)?.trim() || null,
    price: Number(formData.get('price')),
    addon_category: (formData.get('addon_category') as string) || 'gift',
    cover_image_url: coverImageUrl,
    is_active: parseBool(formData, 'is_active'),
    sort_order: Number(formData.get('sort_order') || 0),
  };

  if (id) {
    const { error } = await supabase.from('addons').update(payload).eq('id', id);
    if (error) return { success: false, message: error.message };
  } else {
    const { error } = await supabase.from('addons').insert(payload);
    if (error) return { success: false, message: error.message };
  }

  revalidatePath('/admin/complementos');
  return { success: true };
}

export async function toggleAddonActive(id: string, isActive: boolean) {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('addons').update({ is_active: !isActive }).eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/admin/complementos');
  return { success: true };
}
