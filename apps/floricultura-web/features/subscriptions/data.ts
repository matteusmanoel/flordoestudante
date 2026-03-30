/**
 * Acesso a dados de assinaturas (server-only).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SubscriptionPlanRow, AddonRow } from './mappers';
import { mapPlanToCard, mapPlanToDetail, mapAddonToViewModel } from './mappers';
import type { SubscriptionPlanCard, SubscriptionPlanDetail, AddonViewModel } from './types';

function getClientOrNull() {
  try {
    return createServerSupabaseClient();
  } catch {
    return null;
  }
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanCard[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const { data, error } = await client
    .from('subscription_plans')
    .select('id, name, slug, short_description, description, cover_image_url, price, frequency, delivery_day_of_week, is_active, is_featured, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return ((data ?? []) as SubscriptionPlanRow[]).map(mapPlanToCard);
}

export async function getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlanDetail | null> {
  const client = getClientOrNull();
  if (!client) return null;
  const { data: planData, error: planError } = await client
    .from('subscription_plans')
    .select('id, name, slug, short_description, description, cover_image_url, price, frequency, delivery_day_of_week, is_active, is_featured, sort_order')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (planError || !planData) return null;
  const plan = planData as unknown as SubscriptionPlanRow;

  const { data: addonLinks } = await client
    .from('plan_addons')
    .select('addon_id, sort_order')
    .eq('plan_id', plan.id)
    .order('sort_order', { ascending: true });

  let addons: AddonRow[] = [];
  if (addonLinks && addonLinks.length > 0) {
    const addonIds = addonLinks.map((l: { addon_id: string }) => l.addon_id);
    const { data: addonData } = await client
      .from('addons')
      .select('id, name, slug, description, price, cover_image_url, addon_category, is_active, sort_order')
      .in('id', addonIds)
      .eq('is_active', true);
    addons = (addonData ?? []) as AddonRow[];
  }

  return mapPlanToDetail(plan, addons);
}

export async function getAddonsForProduct(productId: string): Promise<AddonViewModel[]> {
  const client = getClientOrNull();
  if (!client) return [];
  const { data: links } = await client
    .from('product_addons')
    .select('addon_id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (!links || links.length === 0) return [];
  const addonIds = links.map((l: { addon_id: string }) => l.addon_id);
  const { data: addonData } = await client
    .from('addons')
    .select('id, name, slug, description, price, cover_image_url, addon_category, is_active, sort_order')
    .in('id', addonIds)
    .eq('is_active', true);
  return ((addonData ?? []) as AddonRow[]).map(mapAddonToViewModel);
}
