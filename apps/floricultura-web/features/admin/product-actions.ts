'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PRODUCT_KIND } from '@flordoestudante/core';
import { ensureUniqueSlug, slugFromName } from './slug-utils';
import { requireAdminSession } from './session';

export type ProductActionResult = { success: true } | { success: false; message: string };

function parseBool(formData: FormData, key: string): boolean {
  return formData.getAll(key).includes('true');
}

export async function upsertProduct(formData: FormData): Promise<ProductActionResult> {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const id = formData.get('id')?.toString();
  const name = formData.get('name')?.toString()?.trim();
  const categoryId = formData.get('category_id')?.toString();
  const priceStr = formData.get('price')?.toString();
  const compareStr = formData.get('compare_at_price')?.toString()?.trim();
  const shortDescription = formData.get('short_description')?.toString()?.trim() || null;
  const description = formData.get('description')?.toString()?.trim() || null;
  const coverImageUrl = formData.get('cover_image_url')?.toString()?.trim() || '';
  const isActive = parseBool(formData, 'is_active');
  const isFeatured = parseBool(formData, 'is_featured');
  const productKind = (formData.get('product_kind')?.toString() as 'regular' | 'customizable') || PRODUCT_KIND.REGULAR;

  if (!name || !categoryId) {
    return { success: false, message: 'Nome e categoria são obrigatórios.' };
  }

  const price = Number.parseFloat(priceStr ?? '0');
  if (Number.isNaN(price) || price < 0) {
    return { success: false, message: 'Preço inválido.' };
  }

  let compareAt: number | null = null;
  if (compareStr) {
    const c = Number.parseFloat(compareStr);
    if (!Number.isNaN(c) && c >= 0) compareAt = c;
  }

  let slug: string;
  if (id) {
    const { data: existing, error: selErr } = await supabase.from('products').select('slug').eq('id', id).single();
    if (selErr || !existing) {
      return { success: false, message: 'Produto não encontrado.' };
    }
    slug = (existing as { slug: string }).slug;
  } else {
    const base = slugFromName(name);
    slug = await ensureUniqueSlug(supabase, 'products', base);
  }

  const payload = {
    name,
    slug,
    category_id: categoryId,
    price,
    compare_at_price: compareAt,
    short_description: shortDescription,
    description,
    cover_image_url: coverImageUrl || '/img-box-svgrepo-com.svg',
    is_active: isActive,
    is_featured: isFeatured,
    product_kind: productKind,
  };

  if (id) {
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) return { success: false, message: error.message };
    await syncProductAddons(supabase, id, formData);
    await syncProductRecommendations(supabase, id, formData);
  } else {
    const { data: inserted, error } = await supabase.from('products').insert(payload).select('id').single();
    if (error) return { success: false, message: error.message };
    await syncProductAddons(supabase, (inserted as { id: string }).id, formData);
    await syncProductRecommendations(supabase, (inserted as { id: string }).id, formData);
  }

  revalidatePath('/admin/produtos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true };
}

async function syncProductAddons(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  productId: string,
  formData: FormData
) {
  const addonIds = formData.getAll('addon_ids').filter((v): v is string => typeof v === 'string' && v.length > 0);

  await supabase.from('product_addons').delete().eq('product_id', productId);

  for (let i = 0; i < addonIds.length; i++) {
    await supabase.from('product_addons').insert({
      product_id: productId,
      addon_id: addonIds[i],
      sort_order: i,
    });
  }
}

async function syncProductRecommendations(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  productId: string,
  formData: FormData
) {
  const recIds = formData
    .getAll('recommended_product_ids')
    .filter((id): id is string => typeof id === 'string' && id.length > 0 && id !== productId);

  await supabase.from('product_recommendations').delete().eq('product_id', productId);

  for (let i = 0; i < recIds.length; i++) {
    await supabase.from('product_recommendations').insert({
      product_id: productId,
      recommended_product_id: recIds[i],
      sort_order: i,
    });
  }
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ProductActionResult> {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('products').update({ is_active: !isActive }).eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/admin/produtos');
  revalidatePath('/catalogo');
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/admin/produtos');
  revalidatePath('/catalogo');
  return { success: true };
}
