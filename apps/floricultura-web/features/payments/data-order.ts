/**
 * Leitura de pedido + pagamento para página de pagamento (server, service role).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { expireMercadoPagoPaymentIfNeeded } from './expire-payment-if-needed';

export interface OrderItemView {
  name: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderPaymentView {
  publicCode: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;
  subtotalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  customerNote: string | null;
  estimatedText: string | null;
  items: OrderItemView[];
  payment: {
    provider: string;
    status: string;
    expiresAt: string | null;
    mpInitPoint: string | null;
    mpError: string | null;
  } | null;
}

export async function getOrderPaymentView(publicCode: string): Promise<OrderPaymentView | null> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return null;
  }

  const { data: order } = await supabase
    .from('orders')
    .select(
      [
        'id',
        'public_code',
        'status',
        'payment_status',
        'payment_method',
        'fulfillment_type',
        'subtotal_amount',
        'shipping_amount',
        'discount_amount',
        'total_amount',
        'customer_note',
        'estimated_fulfillment_text',
      ].join(', ')
    )
    .eq('public_code', publicCode.trim())
    .maybeSingle();

  if (!order) return null;

  const o = order as unknown as {
    id: string;
    public_code: string;
    status: string;
    payment_status: string;
    payment_method: string;
    fulfillment_type: string;
    subtotal_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    customer_note: string | null;
    estimated_fulfillment_text: string | null;
  };

  await expireMercadoPagoPaymentIfNeeded(supabase, o.id);

  const { data: orderFresh } = await supabase
    .from('orders')
    .select('status, payment_status')
    .eq('id', o.id)
    .single();

  const st = (orderFresh ?? o) as { status: string; payment_status: string };

  const { data: itemsData } = await supabase
    .from('order_items')
    .select('product_name_snapshot, quantity, line_total')
    .eq('order_id', o.id);

  const items: OrderItemView[] =
    (itemsData ?? []).map((row) => {
      const r = row as {
        product_name_snapshot: string;
        quantity: number;
        line_total: number;
      };
      return {
        name: r.product_name_snapshot,
        quantity: r.quantity,
        lineTotal: Number(r.line_total),
      };
    }) ?? [];

  const { data: pays } = await supabase
    .from('payments')
    .select('provider, status, expires_at, raw_payload_json')
    .eq('order_id', o.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const p = pays?.[0] as
    | {
        provider: string;
        status: string;
        expires_at: string | null;
        raw_payload_json: Record<string, unknown> | null;
      }
    | undefined;

  let mpInitPoint: string | null = null;
  let mpError: string | null = null;
  if (p?.raw_payload_json && typeof p.raw_payload_json === 'object') {
    const raw = p.raw_payload_json as Record<string, unknown>;
    if (typeof raw.mp_init_point === 'string') mpInitPoint = raw.mp_init_point;
    if (typeof raw.mp_setup_error === 'string') mpError = raw.mp_setup_error;
  }

  return {
    publicCode: o.public_code,
    orderId: o.id,
    status: st.status,
    paymentStatus: st.payment_status,
    paymentMethod: o.payment_method,
    fulfillmentType: o.fulfillment_type,
    subtotalAmount: Number(o.subtotal_amount),
    shippingAmount: Number(o.shipping_amount),
    discountAmount: Number(o.discount_amount),
    totalAmount: Number(o.total_amount),
    customerNote: o.customer_note,
    estimatedText: o.estimated_fulfillment_text,
    items,
    payment: p
      ? {
          provider: p.provider,
          status: p.status,
          expiresAt: p.expires_at,
          mpInitPoint,
          mpError,
        }
      : null,
  };
}
