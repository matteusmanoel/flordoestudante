/**
 * View models de assinatura para a UI.
 */

import type { SubscriptionFrequency } from '@flordoestudante/core';

export interface SubscriptionPlanCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  coverImageUrl: string | null;
  price: number;
  frequency: SubscriptionFrequency;
  frequencyLabel: string;
  isFeatured: boolean;
}

export interface SubscriptionPlanDetail extends SubscriptionPlanCard {
  deliveryDayOfWeek: number | null;
  addons: AddonViewModel[];
}

export interface AddonViewModel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  coverImageUrl: string | null;
  addonCategory: string;
}
