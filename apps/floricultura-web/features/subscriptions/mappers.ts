/**
 * Mapeamento de rows do Supabase para view models de assinatura.
 */

import { SUBSCRIPTION_FREQUENCY_LABELS } from '@flordoestudante/core';
import type { SubscriptionFrequency } from '@flordoestudante/core';
import type { SubscriptionPlanCard, SubscriptionPlanDetail, AddonViewModel } from './types';

export interface SubscriptionPlanRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  frequency: SubscriptionFrequency;
  delivery_day_of_week: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface AddonRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  cover_image_url: string | null;
  addon_category: string;
  is_active: boolean;
  sort_order: number;
}

export function mapPlanToCard(row: SubscriptionPlanRow): SubscriptionPlanCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? null,
    description: row.description ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    price: Number(row.price),
    frequency: row.frequency,
    frequencyLabel: SUBSCRIPTION_FREQUENCY_LABELS[row.frequency] ?? row.frequency,
    isFeatured: row.is_featured,
  };
}

export function mapPlanToDetail(
  row: SubscriptionPlanRow,
  addons: AddonRow[]
): SubscriptionPlanDetail {
  return {
    ...mapPlanToCard(row),
    deliveryDayOfWeek: row.delivery_day_of_week ?? null,
    addons: addons.map(mapAddonToViewModel),
  };
}

export function mapAddonToViewModel(row: AddonRow): AddonViewModel {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    price: Number(row.price),
    coverImageUrl: row.cover_image_url ?? null,
    addonCategory: row.addon_category,
  };
}
