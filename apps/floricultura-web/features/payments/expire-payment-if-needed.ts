/**
 * Expiração lazy: se payment MP está pending e expires_at passou, marca expired.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { ORDER_STATUS, PAYMENT_STATUS } from '@flordoestudante/core';

export async function expireMercadoPagoPaymentIfNeeded(
  supabase: SupabaseClient,
  orderId: string
): Promise<boolean> {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_method')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || (order as { payment_method: string }).payment_method !== 'mercado_pago') {
    return false;
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('id, status, expires_at')
    .eq('order_id', orderId)
    .eq('provider', 'mercado_pago')
    .order('created_at', { ascending: false })
    .limit(1);

  const p = payments?.[0] as { id: string; status: string; expires_at: string | null } | undefined;
  if (!p || p.status !== PAYMENT_STATUS.PENDING || !p.expires_at) {
    return false;
  }

  if (new Date(p.expires_at) > new Date()) {
    return false;
  }

  await supabase
    .from('payments')
    .update({
      status: PAYMENT_STATUS.EXPIRED,
      updated_at: new Date().toISOString(),
    })
    .eq('id', p.id);

  await supabase
    .from('orders')
    .update({
      payment_status: PAYMENT_STATUS.EXPIRED,
      status: ORDER_STATUS.EXPIRED,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return true;
}
