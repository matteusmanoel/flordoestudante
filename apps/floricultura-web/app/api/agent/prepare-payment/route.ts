/**
 * POST /api/agent/prepare-payment
 *
 * Endpoint chamado pelo workflow n8n (Flora/WhatsApp) após `flor_prepare_checkout`
 * para criar o registro em `payments` e gerar a preferência do Mercado Pago.
 * Retorna checkout_url + mp_init_point + dados PIX para o agente enviar ao cliente.
 *
 * Segurança: validação por header `x-agent-secret` (env AGENT_SHARED_SECRET).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createMpPaymentForOrder } from '@/features/payments/create-payment';
import { getMercadoPagoAccessToken } from '@/lib/mercado-pago/config';
import { getPublicSiteUrl } from '@/lib/site-url';
import { ORDER_STATUS } from '@flordoestudante/core';

function getAgentSecret(): string | undefined {
  return process.env.AGENT_SHARED_SECRET?.trim() || undefined;
}

function getPixConfig(): { key: string; keyType: string; holderName: string } | null {
  const key = process.env.STORE_PIX_KEY?.trim();
  if (!key) return null;
  return {
    key,
    keyType: process.env.STORE_PIX_KEY_TYPE?.trim() || 'random',
    holderName: process.env.STORE_PIX_HOLDER_NAME?.trim() || 'Flor do Estudante',
  };
}

function formatCurrencyBR(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function POST(req: NextRequest) {
  // Autenticação
  const secret = getAgentSecret();
  if (secret) {
    const provided = req.headers.get('x-agent-secret') ?? '';
    if (provided !== secret) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  let body: {
    public_code?: string;
    payment_method?: string;
    payer_email?: string;
    payer_phone?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const publicCode = (body.public_code ?? '').trim();
  if (!publicCode) {
    return NextResponse.json({ ok: false, error: 'public_code_required' }, { status: 400 });
  }

  if (!getMercadoPagoAccessToken()) {
    return NextResponse.json({ ok: false, error: 'mp_not_configured' }, { status: 503 });
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'db_unavailable' }, { status: 503 });
  }

  // Busca pedido
  const { data: orderRaw } = await supabase
    .from('orders')
    .select('id, public_code, status, total_amount, payment_method, customer_id')
    .eq('public_code', publicCode)
    .maybeSingle();

  const order = orderRaw as {
    id: string;
    public_code: string;
    status: string;
    total_amount: number;
    payment_method: string | null;
    customer_id: string | null;
  } | null;

  if (!order) {
    return NextResponse.json({ ok: false, error: 'order_not_found' }, { status: 404 });
  }

  const validStatuses = [ORDER_STATUS.DRAFT, ORDER_STATUS.PENDING_PAYMENT];
  if (!validStatuses.includes(order.status as (typeof validStatuses)[number])) {
    return NextResponse.json(
      { ok: false, error: 'order_not_in_valid_status', status: order.status },
      { status: 422 }
    );
  }

  // Pedido já tem payments row com init_point? Devolver sem recriar.
  const { data: existingPays } = await supabase
    .from('payments')
    .select('id, status, raw_payload_json')
    .eq('order_id', order.id)
    .eq('provider', 'mercado_pago')
    .order('created_at', { ascending: false })
    .limit(1);

  const existingPay = existingPays?.[0] as
    | { id: string; status: string; raw_payload_json: Record<string, unknown> | null }
    | undefined;

  const existingInitPoint =
    typeof existingPay?.raw_payload_json?.mp_init_point === 'string'
      ? (existingPay.raw_payload_json.mp_init_point as string)
      : null;

  // Resolver e-mail do cliente para MP
  let payerEmail: string | undefined = body.payer_email?.trim() || undefined;
  if (!payerEmail && order.customer_id) {
    const { data: custRaw } = await supabase
      .from('customers')
      .select('email')
      .eq('id', order.customer_id)
      .maybeSingle();
    const email = (custRaw as { email: string | null } | null)?.email;
    if (email) payerEmail = email;
  }

  // Avançar draft → pending_payment e garantir payment_method
  if (order.status === ORDER_STATUS.DRAFT || !order.payment_method) {
    await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.PENDING_PAYMENT,
        payment_method: body.payment_method ?? order.payment_method ?? 'mercado_pago',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
  }

  const totalAmount = Number(order.total_amount);

  let initPoint: string | null = existingInitPoint;
  let paymentCreated = false;

  // Criar payments + preferência se ainda não existir
  if (!existingPay || !existingInitPoint) {
    const result = await createMpPaymentForOrder(
      supabase,
      order.id,
      order.public_code,
      totalAmount,
      payerEmail,
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    initPoint = result.initPoint;
    paymentCreated = true;
  }

  // Montar URLs de retorno
  const siteUrl = getPublicSiteUrl();
  const checkoutUrl = `${siteUrl}/pedido/${encodeURIComponent(order.public_code)}/pagamento`;

  // PIX estático (env)
  const pixConfig = getPixConfig();
  const pixPayload = pixConfig
    ? {
        key: pixConfig.key,
        key_type: pixConfig.keyType,
        holder_name: pixConfig.holderName,
        amount: totalAmount,
        amount_formatted: formatCurrencyBR(totalAmount),
        instructions: `Após o pagamento, envie o comprovante aqui que confirmamos seu pedido 🌸`,
      }
    : null;

  return NextResponse.json({
    ok: true,
    public_code: order.public_code,
    checkout_url: checkoutUrl,
    mp_init_point: initPoint,
    payment_created: paymentCreated,
    pix: pixPayload,
  });
}
