/**
 * Cria preference Checkout Pro no Mercado Pago (server-only).
 */

import type { CreatePaymentInput, PaymentPreferenceResult } from '@flordoestudante/payments';
import { getMercadoPagoAccessToken, isMercadoPagoSandbox } from './config';

const MP_API = 'https://api.mercadopago.com';

export async function createMercadoPagoPreference(
  input: CreatePaymentInput
): Promise<PaymentPreferenceResult> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
  }

  const body = {
    items: [
      {
        title: input.description ?? `Pedido ${input.publicCode}`,
        quantity: 1,
        unit_price: Number(input.amount.toFixed(2)),
        currency_id: 'BRL',
      },
    ],
    external_reference: input.orderId,
    notification_url: input.notificationUrl,
    back_urls: input.backUrls ?? {},
    auto_return: 'approved',
    payer: input.payerEmail ? { email: input.payerEmail } : undefined,
    payment_methods: {
      // Checkout Pro deve aceitar somente PIX e cartão.
      excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'account_money' }],
    },
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `pref-${input.orderId}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mercado Pago preference failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  const sandbox = isMercadoPagoSandbox();
  const initPoint = sandbox ? data.sandbox_init_point ?? data.init_point : data.init_point;

  return {
    preferenceId: data.id,
    initPoint,
    sandboxInitPoint: data.sandbox_init_point,
  };
}
