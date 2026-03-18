/**
 * Tipos de catálogo (categoria, produto, imagem, banner).
 */

import type { ProductKind } from '../constants/domain';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  cover_image_url: string;
  is_active: boolean;
  is_featured: boolean;
  product_kind: ProductKind;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  category?: Category;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  cta_label?: string | null;
  cta_href?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
