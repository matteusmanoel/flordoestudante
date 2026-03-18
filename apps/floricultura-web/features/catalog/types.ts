/**
 * View models do catálogo para a UI.
 * Dados já normalizados (campos opcionais tratados).
 */

export interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount?: number;
}

export interface ProductCardModel {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  coverImageUrl: string;
  isFeatured: boolean;
  categorySlug: string;
  categoryName: string;
}

export interface ProductImageViewModel {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductDetailViewModel {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  coverImageUrl: string;
  images: ProductImageViewModel[];
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  isFeatured: boolean;
}

export interface BannerViewModel {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
}
