import Link from 'next/link';
import { requireAdminSession } from '@/features/admin/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminOrdersTableClient } from '@/components/admin/AdminOrdersTableClient';
import { STORE_NAME } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site-url';

type OrderRow = {
  id: string;
  public_code: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  customers: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
  order_items: Array<{ id: string; product_name_snapshot: string }> | null;
};

function normalizeCustomer(
  c: OrderRow['customers']
): { full_name: string; phone: string | null } | null {
  if (!c) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

export default async function AdminPedidosPage() {
  await requireAdminSession();
  const sb = createServerSupabaseClient();
  const { data: orders, error } = await sb
    .from('orders')
    .select(
      'id, public_code, status, payment_status, total_amount, created_at, customers ( full_name, phone ), order_items ( id, product_name_snapshot )'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar pedidos: {error.message}</p>
      </div>
    );
  }

  const list = (orders ?? []) as unknown as OrderRow[];
  const normalizedOrders = list.map((o) => ({
    ...o,
    customers: normalizeCustomer(o.customers),
  }));

  const siteUrl = getSiteUrl();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-medium text-foreground">Pedidos</h1>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Início
        </Link>
      </div>

      <AdminOrdersTableClient orders={normalizedOrders} storeName={STORE_NAME} siteUrl={siteUrl} />
    </div>
  );
}
