import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPaymentSyncSecret } from '@/lib/mercado-pago/config';
import { processMercadoPagoPaymentById } from '@/features/payments/process-mercadopago-webhook';

/**
 * Reconciliação manual: POST com Bearer PAYMENT_SYNC_SECRET.
 * Body: { "providerPaymentId": "..." } ou { "publicCode": "FD-..." } (usa provider_payment_id do pedido).
 */
export async function POST(request: Request) {
  const secret = getPaymentSyncSecret();
  if (!secret) {
    return Response.json(
      { error: 'PAYMENT_SYNC_SECRET não configurado no servidor' },
      { status: 503 }
    );
  }
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { providerPaymentId?: string; publicCode?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.providerPaymentId) {
    const r = await processMercadoPagoPaymentById(body.providerPaymentId);
    return Response.json({ ok: r.ok, reason: r.reason });
  }

  if (body.publicCode) {
    let supabase;
    try {
      supabase = createServerSupabaseClient();
    } catch {
      return Response.json({ error: 'Server config' }, { status: 500 });
    }
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('public_code', body.publicCode.trim())
      .maybeSingle();
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    const { data: pays } = await supabase
      .from('payments')
      .select('provider_payment_id')
      .eq('order_id', (order as { id: string }).id)
      .eq('provider', 'mercado_pago')
      .order('created_at', { ascending: false })
      .limit(1);
    const pid = (pays?.[0] as { provider_payment_id: string | null } | undefined)
      ?.provider_payment_id;
    if (!pid) {
      return Response.json({
        ok: false,
        message: 'Pedido ainda sem ID de pagamento no Mercado Pago (aguardando início do checkout MP).',
      });
    }
    const r = await processMercadoPagoPaymentById(pid);
    return Response.json({ ok: r.ok, reason: r.reason });
  }

  return Response.json(
    { error: 'Informe providerPaymentId ou publicCode' },
    { status: 400 }
  );
}
