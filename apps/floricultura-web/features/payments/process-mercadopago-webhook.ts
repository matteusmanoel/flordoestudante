/**
 * Processa notificação de pagamento do Mercado Pago (webhook / sync).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchMercadoPagoPayment } from '@/lib/mercado-pago/fetch-payment';
import { applyMercadoPagoStatusToOrder } from './apply-mercadopago-status';

export async function processMercadoPagoPaymentById(
  paymentId: string
): Promise<{ ok: boolean; reason?: string }> {
  const details = await fetchMercadoPagoPayment(paymentId);
  if (!details) {
    return { ok: false, reason: 'fetch_failed' };
  }

  let orderId = details.externalReference ?? null;

  if (!orderId) {
    let supabase;
    try {
      supabase = createServerSupabaseClient();
    } catch {
      return { ok: false, reason: 'no_supabase' };
    }
    const { data: row } = await supabase
      .from('payments')
      .select('order_id')
      .eq('provider_payment_id', paymentId)
      .maybeSingle();
    orderId = (row as { order_id: string } | null)?.order_id ?? null;
  }

  if (!orderId) {
    return { ok: false, reason: 'order_not_found' };
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return { ok: false, reason: 'no_supabase' };
  }

  await applyMercadoPagoStatusToOrder({
    supabase,
    orderId,
    sync: {
      providerPaymentId: details.providerPaymentId,
      status: details.status,
      statusDetail: details.statusDetail,
      dateApproved: details.dateApproved,
    },
  });

  return { ok: true };
}
