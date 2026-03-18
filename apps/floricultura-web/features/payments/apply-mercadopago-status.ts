/**
 * Aplica status retornado pelo Mercado Pago em payments + orders (service role).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { mapToInternalStatus } from '@flordoestudante/payments';
import { ORDER_STATUS, PAYMENT_STATUS } from '@flordoestudante/core';
import type { SyncPaymentResult } from '@flordoestudante/payments';

export interface ApplyMpStatusInput {
  supabase: SupabaseClient;
  orderId: string;
  sync: SyncPaymentResult;
  rawPayload?: unknown;
}

export async function applyMercadoPagoStatusToOrder(
  input: ApplyMpStatusInput
): Promise<{ updated: boolean; internalStatus: string }> {
  const { supabase, orderId, sync, rawPayload } = input;
  const internal = mapToInternalStatus('mercado_pago', sync.status, sync.statusDetail);

  const { data: orderRow } = await supabase
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', orderId)
    .maybeSingle();

  if (!orderRow) {
    return { updated: false, internalStatus: internal };
  }

  const { data: payRows } = await supabase
    .from('payments')
    .select('id, status')
    .eq('order_id', orderId)
    .eq('provider', 'mercado_pago')
    .order('created_at', { ascending: false })
    .limit(1);

  const paymentRow = payRows?.[0] as { id: string; status: string } | undefined;
  if (!paymentRow) {
    return { updated: false, internalStatus: internal };
  }

  if (paymentRow.status === PAYMENT_STATUS.PAID && internal === PAYMENT_STATUS.PAID) {
    return { updated: false, internalStatus: internal };
  }

  const paidAt =
    internal === PAYMENT_STATUS.PAID && sync.dateApproved
      ? sync.dateApproved
      : internal === PAYMENT_STATUS.PAID
        ? new Date().toISOString()
        : null;

  const payUpdate: Record<string, unknown> = {
    provider_payment_id: sync.providerPaymentId,
    status: internal,
    paid_at: paidAt,
    updated_at: new Date().toISOString(),
  };
  if (rawPayload != null) payUpdate.raw_payload_json = rawPayload;
  await supabase.from('payments').update(payUpdate).eq('id', paymentRow.id);

  if (internal === PAYMENT_STATUS.PAID) {
    await supabase
      .from('orders')
      .update({
        payment_status: PAYMENT_STATUS.PAID,
        status: ORDER_STATUS.AWAITING_APPROVAL,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    return { updated: true, internalStatus: internal };
  }

  if (internal === PAYMENT_STATUS.EXPIRED) {
    await supabase
      .from('orders')
      .update({
        payment_status: PAYMENT_STATUS.EXPIRED,
        status: ORDER_STATUS.EXPIRED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    return { updated: true, internalStatus: internal };
  }

  if (
    internal === PAYMENT_STATUS.CANCELLED ||
    internal === PAYMENT_STATUS.FAILED
  ) {
    await supabase
      .from('orders')
      .update({
        payment_status: internal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    return { updated: true, internalStatus: internal };
  }

  await supabase
    .from('orders')
    .update({
      payment_status: PAYMENT_STATUS.PENDING,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return { updated: true, internalStatus: internal };
}
