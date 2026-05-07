/**
 * Leitura de pedido + pagamento para página de pagamento (server, service role).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { expireMercadoPagoPaymentIfNeeded } from './expire-payment-if-needed';

export interface OrderItemView {
  name: string;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface AddressSnapshotView {
  recipientName?: string | null;
  phone?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
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
  giftMessage: string | null;
  estimatedText: string | null;
  addressSnapshot: AddressSnapshotView | null;
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
        'gift_message',
        'address_snapshot_json',
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
    gift_message: string | null;
    address_snapshot_json: Record<string, unknown> | null;
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
    .select('product_name_snapshot, quantity, line_total, product_id')
    .eq('order_id', o.id);

  // Buscar cover_image_url para os produtos
  const productIds = (itemsData ?? [])
    .map((i) => (i as { product_id: string | null }).product_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const productImages: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, cover_image_url')
      .in('id', productIds);
    if (products) {
      for (const p of products) {
        const prod = p as { id: string; cover_image_url: string | null };
        if (prod.cover_image_url) {
          productImages[prod.id] = prod.cover_image_url;
        }
      }
    }
  }

  const items: OrderItemView[] =
    (itemsData ?? []).map((row) => {
      const r = row as {
        product_name_snapshot: string;
        quantity: number;
        line_total: number;
        product_id: string | null;
      };
      return {
        name: r.product_name_snapshot,
        quantity: r.quantity,
        lineTotal: Number(r.line_total),
        imageUrl: r.product_id ? productImages[r.product_id] : undefined,
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

  let addressSnapshot: AddressSnapshotView | null = null;
  if (o.address_snapshot_json && typeof o.address_snapshot_json === 'object') {
    const raw = o.address_snapshot_json as Record<string, unknown>;
    addressSnapshot = {
      recipientName: (raw.recipient_name as string | null) ?? null,
      phone: (raw.phone as string | null) ?? null,
      street: (raw.street as string | null) ?? null,
      number: (raw.number as string | null) ?? null,
      complement: (raw.complement as string | null) ?? null,
      neighborhood: (raw.neighborhood as string | null) ?? null,
      city: (raw.city as string | null) ?? null,
      state: (raw.state as string | null) ?? null,
      postalCode: (raw.postal_code as string | null) ?? null,
    };
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
    giftMessage: o.gift_message,
    estimatedText: o.estimated_fulfillment_text,
    addressSnapshot,
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
