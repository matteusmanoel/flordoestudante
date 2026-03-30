'use server';

import { getRecommendedForCheckout } from '@/features/catalog/data';
import type { ProductCardModel } from '@/features/catalog/types';

export async function getRecommendedForCheckoutAction(
  cartProductIds: string[]
): Promise<ProductCardModel[]> {
  return getRecommendedForCheckout(cartProductIds);
}
