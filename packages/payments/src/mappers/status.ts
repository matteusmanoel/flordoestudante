/**
 * Mapeamento entre status do Mercado Pago e status interno (core).
 */

import { PAYMENT_STATUS } from '@flordoestudante/core';
import type { MapToInternalStatusInput, MapToInternalStatusResult } from '../contracts';

const MP_STATUS_MAP: Record<string, MapToInternalStatusResult> = {
  pending: PAYMENT_STATUS.PENDING,
  approved: PAYMENT_STATUS.PAID,
  authorized: PAYMENT_STATUS.AUTHORIZED,
  in_process: PAYMENT_STATUS.PENDING,
  in_mediation: PAYMENT_STATUS.PENDING,
  rejected: PAYMENT_STATUS.FAILED,
  cancelled: PAYMENT_STATUS.CANCELLED,
  refunded: PAYMENT_STATUS.REFUNDED_MANUAL,
  charged_back: PAYMENT_STATUS.FAILED,
};

/**
 * Converte status do provedor para status interno.
 */
export function mapProviderStatusToInternal(input: MapToInternalStatusInput): MapToInternalStatusResult {
  const { providerStatus } = input;
  const normalized = String(providerStatus).toLowerCase();
  return MP_STATUS_MAP[normalized] ?? PAYMENT_STATUS.PENDING;
}
