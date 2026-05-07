/**
 * Cria registro em `payments` + preferência Mercado Pago para um pedido existente.
 * Reutilizado por: finalizeCheckout (web), retryMercadoPagoPreference, /api/agent/prepare-payment.
 * NÃO é um server action — os chamadores devem trazer o Supabase client e garantir contexto seguro.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { PAYMENT_STATUS } from '@flordoestudante/core';
import { createMercadoPagoPreference } from '@/lib/mercado-pago/create-preference';
import { getMercadoPagoAccessToken } from '@/lib/mercado-pago/config';
import { getPublicSiteUrl } from '@/lib/site-url';

const PAYMENT_EXPIRY_HOURS = 24;

export interface CreateMpPaymentSuccess {
  ok: true;
  paymentId: string;
  initPoint: string | null;
  mpError?: string;
}

export interface CreateMpPaymentFailure {
  ok: false;
  error: string;
}

export type CreateMpPaymentResult = CreateMpPaymentSuccess | CreateMpPaymentFailure;

/**
 * Insere `payments` e tenta criar a preferência do Checkout Pro.
 * Se a chamada ao Mercado Pago falhar (ex.: token sandbox), retorna ok=true
 * com initPoint=null e mpError preenchido — o pedido ainda existe e o cliente
 * poderá tentar gerar o link novamente pela página de pagamento.
 */
export async function createMpPaymentForOrder(
  supabase: SupabaseClient,
  orderId: string,
  publicCode: string,
  totalAmount: number,
  payerEmail?: string | null,
): Promise<CreateMpPaymentResult> {
  if (!getMercadoPagoAccessToken()) {
    return { ok: false, error: 'Pagamento online não configurado.' };
  }

  const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_HOURS * 3600 * 1000).toISOString();

  const { data: payIns, error: payErr } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      provider: 'mercado_pago',
      amount: totalAmount,
      status: PAYMENT_STATUS.PENDING,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (payErr || !payIns) {
    return { ok: false, error: 'Não foi possível registrar o pagamento.' };
  }

  const paymentId = (payIns as { id: string }).id;
  const siteUrl = getPublicSiteUrl();
  const notificationUrl = `${siteUrl}/api/webhooks/mercado-pago`;

  let initPoint: string | null = null;
  let mpError: string | undefined;

  try {
    const pref = await createMercadoPagoPreference({
      orderId,
      publicCode,
      amount: totalAmount,
      description: `Pedido ${publicCode}`,
      payerEmail: payerEmail ?? undefined,
      notificationUrl,
      backUrls: {
        success: `${siteUrl}/pedido/${encodeURIComponent(publicCode)}/pagamento?status=success`,
        failure: `${siteUrl}/pedido/${encodeURIComponent(publicCode)}/pagamento?status=failure`,
        pending: `${siteUrl}/pedido/${encodeURIComponent(publicCode)}/pagamento?status=pending`,
      },
    });

    initPoint = pref.initPoint ?? null;

    await supabase
      .from('payments')
      .update({
        provider_preference_id: pref.preferenceId,
        raw_payload_json: { mp_init_point: initPoint, mp_preference_id: pref.preferenceId },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
  } catch (e) {
    mpError = e instanceof Error ? e.message : 'Falha ao criar link de pagamento.';
    await supabase
      .from('payments')
      .update({
        raw_payload_json: { mp_setup_error: mpError },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
  }

  return { ok: true, paymentId, initPoint, mpError };
}
