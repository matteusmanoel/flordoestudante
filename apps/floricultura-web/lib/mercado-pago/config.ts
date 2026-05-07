/**
 * Config Mercado Pago (server-only).
 */

let warnedLegacyTokenEnv = false;

export function getMercadoPagoAccessToken(): string | undefined {
  const canonical = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (canonical) return canonical;

  const legacy = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (legacy && !warnedLegacyTokenEnv) {
    warnedLegacyTokenEnv = true;
    console.warn(
      '[mercado-pago] Variável legada MERCADOPAGO_ACCESS_TOKEN detectada. Migre para MERCADO_PAGO_ACCESS_TOKEN.'
    );
  }

  const t = legacy;
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
