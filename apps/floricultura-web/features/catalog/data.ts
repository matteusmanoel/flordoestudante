/**
 * Acesso a dados do catálogo (server-only).
 * Retorna arrays vazios quando Supabase não está configurado ou em caso de erro.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CategoryRow, ProductRow, ProductImageRow, BannerRow } from './mappers';
import {
  mapCategoryToCard,
  mapProductToCard,
  mapProductToDetail,
  mapProductImageToViewModel,
  mapBannerToViewModel,
} from './mappers';
import type { CategoryCard, ProductCardModel, ProductDetailViewModel, BannerViewModel } from './types';

function getClientOrNull() {
  try {
    return createServerSupabaseClient();
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<CategoryCard[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, description, image_url, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  const rows = (data ?? []) as CategoryRow[];
  const withCount = await Promise.all(
    rows.map(async (row) => {
      const { count } = await client
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', row.id)
        .eq('is_active', true);
      return mapCategoryToCard(row, count ?? 0);
    })
  );
  return withCount;
}

export async function getBanners(): Promise<BannerViewModel[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const { data, error } = await client
    .from('banners')
    .select('id, title, subtitle, image_url, cta_label, cta_href, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return ((data ?? []) as BannerRow[]).map(mapBannerToViewModel);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardModel[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const { data, error } = await client
    .from('products')
    .select('id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  const rows = (data ?? []) as ProductRow[];
  return rows.map(mapProductToCard);
}

export async function getProducts(options?: {
  categorySlug?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: ProductCardModel[]; total: number }> {
  const client = getClientOrNull();
  if (!client) return { products: [], total: 0 };
  let query = client
    .from('products')
    .select('id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)', { count: 'exact' })
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (options?.categorySlug) {
    const { data: cat } = await client.from('categories').select('id').eq('slug', options.categorySlug).eq('is_active', true).single();
    if (cat?.id) query = query.eq('category_id', cat.id);
  }
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return { products: [], total: 0 };
  const rows = (data ?? []) as ProductRow[];
  return { products: rows.map(mapProductToCard), total: count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<ProductDetailViewModel | null> {
  const client = getClientOrNull();
  if (!client) return null;
  const { data: productData, error: productError } = await client
    .from('products')
    .select('id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (productError || !productData) return null;
  const product = productData as unknown as ProductRow;
  const { data: imagesData } = await client
    .from('product_images')
    .select('id, image_url, alt_text, sort_order')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true });
  const images = (imagesData ?? []) as ProductImageRow[];
  return mapProductToDetail(product, images);
}

export async function getProductCountByCategory(categoryId: string): Promise<number> {
  const client = getClientOrNull();
  if (!client) return 0;
  const { count } = await client
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('is_active', true);
  return count ?? 0;
}
