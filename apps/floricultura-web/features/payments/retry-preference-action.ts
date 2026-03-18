'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ORDER_STATUS, PAYMENT_STATUS } from '@flordoestudante/core';
import { createMercadoPagoPreference } from '@/lib/mercado-pago/create-preference';
import { getMercadoPagoAccessToken } from '@/lib/mercado-pago/config';
import { getPublicSiteUrl } from '@/lib/site-url';

export async function retryMercadoPagoPreference(
  publicCode: string
): Promise<{ ok: true; initPoint: string } | { ok: false; message: string }> {
  if (!getMercadoPagoAccessToken()) {
    return { ok: false, message: 'Pagamento online não configurado.' };
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return { ok: false, message: 'Servidor indisponível.' };
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, public_code, status, total_amount, payment_method')
    .eq('public_code', publicCode.trim())
    .maybeSingle();

  const o = order as {
    id: string;
    public_code: string;
    status: string;
    total_amount: number;
    payment_method: string;
  } | null;

  if (!o || o.payment_method !== 'mercado_pago') {
    return { ok: false, message: 'Pedido não encontrado ou não é pagamento online.' };
  }

  if (o.status !== ORDER_STATUS.PENDING_PAYMENT && o.status !== ORDER_STATUS.DRAFT) {
    return { ok: false, message: 'Este pedido não está aguardando pagamento online.' };
  }

  const { data: pays } = await supabase
    .from('payments')
    .select('id, status')
    .eq('order_id', o.id)
    .eq('provider', 'mercado_pago')
    .order('created_at', { ascending: false })
    .limit(1);

  const pay = pays?.[0] as { id: string; status: string } | undefined;
  if (!pay) {
    return { ok: false, message: 'Pagamento não encontrado.' };
  }
  if (
    pay.status !== PAYMENT_STATUS.PENDING &&
    pay.status !== PAYMENT_STATUS.FAILED &&
    pay.status !== PAYMENT_STATUS.CANCELLED
  ) {
    return { ok: false, message: 'Não é possível gerar novo link para este pagamento.' };
  }
  if (pay.status !== PAYMENT_STATUS.PENDING) {
    await supabase
      .from('payments')
      .update({ status: PAYMENT_STATUS.PENDING, updated_at: new Date().toISOString() })
      .eq('id', pay.id);
    await supabase
      .from('orders')
      .update({
        payment_status: PAYMENT_STATUS.PENDING,
        status: ORDER_STATUS.PENDING_PAYMENT,
        updated_at: new Date().toISOString(),
      })
      .eq('id', o.id);
  }

  const { data: ordRow } = await supabase
    .from('orders')
    .select('customer_id')
    .eq('id', o.id)
    .single();
  const cid = (ordRow as { customer_id: string } | null)?.customer_id;
  let email: string | undefined;
  if (cid) {
    const { data: cust } = await supabase.from('customers').select('email').eq('id', cid).maybeSingle();
    email = (cust as { email: string | null } | null)?.email ?? undefined;
  }

  const siteUrl = getPublicSiteUrl();
  const notificationUrl = `${siteUrl}/api/webhooks/mercado-pago`;

  try {
    const pref = await createMercadoPagoPreference({
      orderId: o.id,
      publicCode: o.public_code,
      amount: Number(o.total_amount),
      description: `Pedido ${o.public_code}`,
      payerEmail: email,
      notificationUrl,
      backUrls: {
        success: `${siteUrl}/pedido/${encodeURIComponent(o.public_code)}/pagamento?status=success`,
        failure: `${siteUrl}/pedido/${encodeURIComponent(o.public_code)}/pagamento?status=failure`,
        pending: `${siteUrl}/pedido/${encodeURIComponent(o.public_code)}/pagamento?status=pending`,
      },
    });

    const initPoint = pref.initPoint ?? '';
    if (!initPoint) {
      return { ok: false, message: 'Mercado Pago não retornou URL de pagamento.' };
    }

    await supabase
      .from('payments')
      .update({
        provider_preference_id: pref.preferenceId,
        raw_payload_json: { mp_init_point: initPoint, mp_preference_id: pref.preferenceId },
        updated_at: new Date().toISOString(),
      })
      .eq('id', pay.id);

    if (o.status === ORDER_STATUS.DRAFT) {
      await supabase
        .from('orders')
        .update({ status: ORDER_STATUS.PENDING_PAYMENT })
        .eq('id', o.id);
    }

    return { ok: true, initPoint };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar link.';
    return { ok: false, message: msg };
  }
}
