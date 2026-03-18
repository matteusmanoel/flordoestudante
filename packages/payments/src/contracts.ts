/**
 * Contratos do domínio de pagamento (Mercado Pago e manual).
 */

import type { PaymentStatus } from '@flordoestudante/core';

export interface CreatePaymentInput {
  orderId: string;
  publicCode: string;
  amount: number;
  description?: string;
  payerEmail?: string;
  payerPhone?: string;
  notificationUrl: string;
  backUrls?: { success?: string; failure?: string; pending?: string };
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint?: string;
  sandboxInitPoint?: string;
}

export interface CreatePixPaymentInput {
  orderId: string;
  amount: number;
  description?: string;
  payerEmail?: string;
  notificationUrl: string;
  idempotencyKey: string;
}

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
}

export interface WebhookPayload {
  id: string;
  type: string;
  data: { id: string };
}

export interface SyncPaymentResult {
  providerPaymentId: string;
  status: string;
  statusDetail?: string;
  dateApproved?: string | null;
  /** UUID do pedido quando o MP retorna external_reference da preference. */
  externalReference?: string | null;
}

export interface MapToInternalStatusInput {
  provider: 'mercado_pago';
  providerStatus: string;
  providerStatusDetail?: string;
}

export type MapToInternalStatusResult = PaymentStatus;
