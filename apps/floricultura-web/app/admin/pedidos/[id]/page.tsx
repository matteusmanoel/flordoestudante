import { notFound } from 'next/navigation';
import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OrderAdminDetailModal } from './OrderAdminDetailModal';

export default async function AdminPedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const sb = createServerSupabaseClient();

  const { data: order, error } = await sb
    .from('orders')
    .select(
      'id, public_code, status, estimated_fulfillment_text, admin_note, customers ( full_name, phone ), order_items ( id, product_name_snapshot, unit_price_snapshot, quantity, line_total )'
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const o = order as {
    id: string;
    public_code: string;
    status: string;
    estimated_fulfillment_text: string | null;
    admin_note: string | null;
    customers: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
    order_items: Array<{
      id: string;
      product_name_snapshot: string;
      unit_price_snapshot: string;
      quantity: number;
      line_total: string;
    }> | null;
  };

  const customer = Array.isArray(o.customers) ? (o.customers[0] ?? null) : o.customers;

  const { data: products } = await sb
    .from('products')
    .select('id, name, price')
    .eq('is_active', true)
    .order('name')
    .limit(200);

  return (
    <OrderAdminDetailModal
      orderId={o.id}
      publicCode={o.public_code}
      initialStatus={o.status}
      estimatedText={o.estimated_fulfillment_text}
      adminNote={o.admin_note}
      customerName={customer?.full_name ?? null}
      customerPhone={customer?.phone ?? null}
      items={o.order_items ?? []}
      products={(products ?? []) as Array<{ id: string; name: string; price: string }>}
    />
  );
}
