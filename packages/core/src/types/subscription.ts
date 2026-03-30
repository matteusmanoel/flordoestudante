/**
 * Tipos de assinatura e planos.
 */

import type { SubscriptionFrequency, SubscriptionStatus } from '../constants/domain';
import type { AddressSnapshot } from './customer';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  price: number;
  frequency: SubscriptionFrequency;
  delivery_day_of_week?: number | null;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  addons?: Addon[];
}

export interface Subscription {
  id: string;
  plan_id: string;
  customer_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  address_snapshot_json?: AddressSnapshot | null;
  customer_note?: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  paused_at?: string | null;
  plan?: SubscriptionPlan;
}

export interface Addon {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  cover_image_url?: string | null;
  addon_category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  addon_id: string;
  sort_order: number;
  addon?: Addon;
}

export interface PlanAddon {
  id: string;
  plan_id: string;
  addon_id: string;
  sort_order: number;
  addon?: Addon;
}
