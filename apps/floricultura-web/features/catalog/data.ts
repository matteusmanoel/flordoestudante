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

/** Produtos com preço promocional (compare_at_price > price). */
export async function getPromoProducts(limit = 8): Promise<ProductCardModel[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const sample = Math.min(60, Math.max(limit * 4, limit));
  const { data, error } = await client
    .from('products')
    .select('id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)')
    .eq('is_active', true)
    .not('compare_at_price', 'is', null)
    .order('created_at', { ascending: false })
    .limit(sample);
  if (error) return [];
  const rows = (data ?? []) as ProductRow[];
  const promos = rows.filter(
    (r) => r.compare_at_price != null && Number(r.compare_at_price) > Number(r.price)
  );
  return promos.slice(0, limit).map(mapProductToCard);
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

/** Produtos recomendados para "Complete seu presente" (por product_id). */
export async function getRecommendedProductsForProduct(productId: string): Promise<ProductCardModel[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const { data: links, error: linkError } = await client
    .from('product_recommendations')
    .select('recommended_product_id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (linkError || !links?.length) return [];
  const ids = links.map((r: { recommended_product_id: string }) => r.recommended_product_id);
  const { data: productsData, error } = await client
    .from('products')
    .select('id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)')
    .in('id', ids)
    .eq('is_active', true);
  if (error || !productsData?.length) return [];
  const orderMap = new Map(links.map((l: { recommended_product_id: string; sort_order: number }) => [l.recommended_product_id, l.sort_order]));
  const rows = (productsData as ProductRow[]).sort(
    (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
  );
  return rows.map(mapProductToCard);
}

/**
 * Busca produtos agrupados por categoria para exibição em carrosséis na homepage.
 * Retorna no máximo `limitPerCategory` produtos por categoria, ordenados por destaque e data.
 */
export async function getProductsByCategory(options?: {
  limitPerCategory?: number;
  maxCategories?: number;
}): Promise<{ category: CategoryCard; products: ProductCardModel[] }[]> {
  const client = getClientOrNull();
  if (!client) return [];

  const { limitPerCategory = 10, maxCategories = 8 } = options ?? {};

  const categories = await getCategories();
  const topCategories = categories.slice(0, maxCategories);

  const result = await Promise.all(
    topCategories.map(async (cat) => {
      const { data: catRow } = await client
        .from('categories')
        .select('id')
        .eq('slug', cat.slug)
        .single();
      if (!catRow?.id) return { category: cat, products: [] };

      const { data, error } = await client
        .from('products')
        .select(
          'id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)'
        )
        .eq('is_active', true)
        .eq('category_id', catRow.id)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limitPerCategory);
      if (error) return { category: cat, products: [] };
      return { category: cat, products: (data as ProductRow[]).map(mapProductToCard) };
    })
  );

  return result.filter((r) => r.products.length > 0);
}

/** Recomendados para exibir no checkout: produtos recomendados por qualquer item do carrinho, excluindo os já no carrinho. */
export async function getRecommendedForCheckout(cartProductIds: string[]): Promise<ProductCardModel[]> {
  const client = getClientOrNull();
  if (!client || cartProductIds.length === 0) return [];
  const seen = new Set(cartProductIds);
  const { data: links } = await client
    .from('product_recommendations')
    .select('product_id, recommended_product_id, sort_order')
    .in('product_id', cartProductIds)
    .order('sort_order', { ascending: true });
  if (!links?.length) return [];
  const recommendedIds = [...new Set((links as { recommended_product_id: string }[]).map((r) => r.recommended_product_id).filter((id) => !seen.has(id)))];
  if (recommendedIds.length === 0) return [];
  const { data: productsData, error } = await client
    .from('products')
    .select('id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, categories(name, slug)')
    .in('id', recommendedIds)
    .eq('is_active', true);
  if (error || !productsData?.length) return [];
  return (productsData as ProductRow[]).map(mapProductToCard);
}
