/**
 * Config Mercado Pago (server-only).
 */

export function getMercadoPagoAccessToken(): string | undefined {
  const t = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  return t || undefined;
}

export function isMercadoPagoSandbox(): boolean {
  const token = getMercadoPagoAccessToken();
  return token?.startsWith('TEST-') ?? false;
}

export function getMercadoPagoWebhookSecret(): string | undefined {
  const s = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  return s || undefined;
}

export function getPaymentSyncSecret(): string | undefined {
  return process.env.PAYMENT_SYNC_SECRET?.trim() || undefined;
}
