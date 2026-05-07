/**
 * Mapeamento de rows do Supabase para view models do catálogo.
 */

import { isPlaceholderMediaUrl } from '@/lib/constants';
import { resolvePublicImageUrl } from '@/lib/image-url';
import type { CategoryCard, ProductCardModel, ProductDetailViewModel, ProductImageViewModel, BannerViewModel } from './types';

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cover_image_url: string;
  image_url?: string | null;
  is_active: boolean;
  is_featured: boolean;
  categories?: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

export interface ProductImageRow {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_label: string | null;
  cta_href: string | null;
  is_active: boolean;
  sort_order: number;
}

export function mapCategoryToCard(row: CategoryRow, productCount?: number): CategoryCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
    productCount,
  };
}

export function mapProductToCard(row: ProductRow): ProductCardModel {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const coverImageUrl = (row.cover_image_url ?? '').trim() || (row.image_url ?? '').trim() || '';
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? null,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    coverImageUrl,
    isFeatured: row.is_featured ?? false,
    categorySlug: category?.slug ?? '',
    categoryName: category?.name ?? '',
  };
}

export function mapProductImageToViewModel(row: ProductImageRow): ProductImageViewModel {
  return {
    id: row.id,
    imageUrl: row.image_url,
    altText: row.alt_text ?? null,
    sortOrder: row.sort_order,
  };
}

function sameResolvedImageUrl(a: string, b: string): boolean {
  const ra = resolvePublicImageUrl(a).trim();
  const rb = resolvePublicImageUrl(b).trim();
  if (ra && rb && ra === rb) return true;
  return a.trim() === b.trim();
}

export function mapProductToDetail(
  product: ProductRow,
  images: ProductImageRow[]
): ProductDetailViewModel {
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const viewImages = images
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapProductImageToViewModel);
  let coverImageUrl = (product.cover_image_url ?? '').trim();
  if (!coverImageUrl) {
    coverImageUrl = (product.image_url ?? '').trim();
  }
  if (isPlaceholderMediaUrl(coverImageUrl) && viewImages.length > 0) {
    const firstUsable = viewImages.find((img) => !isPlaceholderMediaUrl(img.imageUrl));
    if (firstUsable) coverImageUrl = firstUsable.imageUrl.trim();
  }
  const imagesDeduped = viewImages.filter((img) => !sameResolvedImageUrl(img.imageUrl, coverImageUrl));
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.short_description ?? null,
    description: product.description ?? null,
    price: Number(product.price),
    compareAtPrice: product.compare_at_price != null ? Number(product.compare_at_price) : null,
    coverImageUrl,
    images: imagesDeduped,
    categoryId: product.category_id,
    categoryName: category?.name ?? '',
    categorySlug: category?.slug ?? '',
    isFeatured: product.is_featured ?? false,
  };
}

export function mapBannerToViewModel(row: BannerRow): BannerViewModel {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? null,
    imageUrl: row.image_url,
    ctaLabel: row.cta_label ?? null,
    ctaHref: row.cta_href ?? null,
    sortOrder: row.sort_order,
  };
}
