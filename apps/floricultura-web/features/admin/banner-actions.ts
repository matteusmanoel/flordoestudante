'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAdminSession } from './session';

export type BannerActionResult = { success: true } | { success: false; message: string };

function parseBool(formData: FormData, key: string): boolean {
  return formData.getAll(key).includes('true');
}

export async function upsertBanner(formData: FormData): Promise<BannerActionResult> {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const id = formData.get('id')?.toString();
  const title = formData.get('title')?.toString()?.trim();
  const subtitle = formData.get('subtitle')?.toString()?.trim() || null;
  let imageUrl = formData.get('image_url')?.toString()?.trim() || '';
  const ctaLabel = formData.get('cta_label')?.toString()?.trim() || null;
  const ctaHref = formData.get('cta_href')?.toString()?.trim() || null;
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const isActive = parseBool(formData, 'is_active');

  if (!title) {
    return { success: false, message: 'Título é obrigatório.' };
  }
  if (!imageUrl) {
    imageUrl = '/img-box-svgrepo-com.svg';
  }

  const payload = {
    title,
    subtitle,
    image_url: imageUrl,
    cta_label: ctaLabel,
    cta_href: ctaHref,
    is_active: isActive,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
  };

  if (id) {
    const { error } = await supabase.from('banners').update(payload).eq('id', id);
    if (error) return { success: false, message: error.message };
  } else {
    const { error } = await supabase.from('banners').insert(payload);
    if (error) return { success: false, message: error.message };
  }

  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { success: true };
}

export async function toggleBannerActive(id: string, isActive: boolean): Promise<BannerActionResult> {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('banners').update({ is_active: !isActive }).eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { success: true };
}

export async function deleteBanner(id: string): Promise<BannerActionResult> {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { success: true };
}
