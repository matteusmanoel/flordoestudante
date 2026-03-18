/**
 * Tipos de pagamento.
 */

import type { PaymentStatus } from '../constants/payment';
import type { PaymentProvider } from '../constants/domain';

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_payment_id?: string | null;
  provider_preference_id?: string | null;
  status: PaymentStatus;
  amount: number;
  expires_at?: string | null;
  paid_at?: string | null;
  raw_payload_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
