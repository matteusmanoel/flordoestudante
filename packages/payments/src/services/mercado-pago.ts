/**
 * Serviço base Mercado Pago — contratos e estrutura.
 * A implementação HTTP/SDK fica no app (env e keys por app).
 */

import type {
  CreatePaymentInput,
  PaymentPreferenceResult,
  CreatePixPaymentInput,
  PixPaymentResult,
  SyncPaymentResult,
  WebhookPayload,
} from '../contracts';
import { mapProviderStatusToInternal } from '../mappers/status';
import type { MapToInternalStatusResult } from '../contracts';

export interface MercadoPagoConfig {
  accessToken: string;
  baseUrl?: string;
}

/**
 * Contrato do serviço Mercado Pago (implementação no app).
 */
export interface MercadoPagoService {
  createPreference(input: CreatePaymentInput, config: MercadoPagoConfig): Promise<PaymentPreferenceResult>;
  createPixPayment?(input: CreatePixPaymentInput, config: MercadoPagoConfig): Promise<PixPaymentResult>;
  getPayment?(paymentId: string, config: MercadoPagoConfig): Promise<SyncPaymentResult | null>;
}

/**
 * Valida assinatura do webhook (implementação no app com secret).
 */
/** Placeholder: implementar no app com crypto. */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) return false;
  return true;
}

/**
 * Parse do body do webhook MP.
 */
export function parseWebhookPayload(body: unknown): WebhookPayload | null {
  if (body == null || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.type !== 'string' || typeof o.data !== 'object') return null;
  const data = o.data as Record<string, unknown>;
  if (typeof data.id !== 'string') return null;
  return { id: o.id, type: o.type, data: { id: data.id } };
}

/**
 * Mapeia status do provedor para status interno (re-export para uso no app).
 */
export function mapToInternalStatus(
  provider: 'mercado_pago',
  providerStatus: string,
  providerStatusDetail?: string
): MapToInternalStatusResult {
  return mapProviderStatusToInternal({
    provider,
    providerStatus,
    providerStatusDetail,
  });
}
