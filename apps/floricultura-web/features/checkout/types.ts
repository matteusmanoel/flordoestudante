/**
 * Tipos do checkout — alinhados a packages/core e ao schema Supabase.
 */

import type { CheckoutFormValues } from '@flordoestudante/core';
import type { CartCheckoutPayload } from '@/features/cart';

export type { CheckoutFormValues };

export interface ShippingRuleOption {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

export interface AddressSnapshotPayload {
  recipient_name: string;
  phone: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  reference?: string | null;
}

export interface CreateOrderInput {
  form: CheckoutFormValues;
  cart: CartCheckoutPayload;
  shippingAmount: number;
  shippingRuleId: string | null;
}

export interface FinalizeCheckoutMpSuccess {
  success: true;
  publicCode: string;
  orderId: string;
  paymentFlow: 'mercado_pago';
  /** URL para pagar; null se preference falhou (ir à página de pagamento para tentar de novo). */
  initPoint: string | null;
  mpError?: string;
}

export interface FinalizeCheckoutOfflineSuccess {
  success: true;
  publicCode: string;
  orderId: string;
  paymentFlow: 'offline';
}

export interface CreateOrderError {
  success: false;
  code:
    | 'EMPTY_CART'
    | 'VALIDATION'
    | 'SHIPPING_RULE'
    | 'PERSISTENCE'
    | 'PAYMENT_METHOD'
    | 'MERCADO_PAGO_CONFIG';
  message: string;
}

export type FinalizeCheckoutResponse =
  | FinalizeCheckoutMpSuccess
  | FinalizeCheckoutOfflineSuccess
  | CreateOrderError;
