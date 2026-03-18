/**
 * Busca pagamento no Mercado Pago por ID (server-only).
 */

import type { SyncPaymentResult } from '@flordoestudante/payments';
import { getMercadoPagoAccessToken } from './config';

const MP_API = 'https://api.mercadopago.com';

export async function fetchMercadoPagoPayment(paymentId: string): Promise<SyncPaymentResult | null> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) return null;

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const j = (await res.json()) as {
    id: number | string;
    status: string;
    status_detail?: string;
    date_approved?: string | null;
    external_reference?: string | null;
  };

  return {
    providerPaymentId: String(j.id),
    status: j.status,
    statusDetail: j.status_detail,
    dateApproved: j.date_approved ?? null,
    externalReference: j.external_reference ?? null,
  };
}
