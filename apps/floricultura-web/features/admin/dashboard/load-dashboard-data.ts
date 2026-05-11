/**
 * Agregações para a home do admin. Usa o mesmo cliente server que o restante
 * do painel (service role quando SUPABASE_SERVICE_ROLE_KEY está definida).
 * Se o volume crescer, preferir uma RPC SQL única (ex.: dashboard_metrics).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardAttentionOrder, DashboardData, DashboardImportRow, DashboardPeriodMoney } from './types';

/** Mesmo conjunto de "abertos" que `AdminOrdersTableClient` (STATUS_GROUPS.open). */
export const DASHBOARD_OPEN_ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'awaiting_approval',
  'in_production',
  'ready_for_pickup',
  'out_for_delivery',
] as const;

const ATTENTION_STATUSES = ['awaiting_approval', 'pending_payment', 'paid'] as const;

const IN_PROGRESS_STATUSES = ['in_production', 'ready_for_pickup', 'out_for_delivery'] as const;

const TERMINAL_BAD = ['draft', 'cancelled', 'expired'] as const;

function isoStartUtcDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function parseAmount(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

async function countProducts(
  sb: SupabaseClient,
  isActive: boolean
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await sb
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', isActive);
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: count ?? 0, error: null };
}

async function loadPeriodMoney(
  sb: SupabaseClient,
  sinceIso: string
): Promise<{ data: DashboardPeriodMoney; error: Error | null }> {
  const terminalList = TERMINAL_BAD.join(',');

  const [mpRes, payOnRes, completedWithDate, completedLegacy] = await Promise.all([
    sb
      .from('orders')
      .select('total_amount')
      .eq('payment_method', 'mercado_pago')
      .eq('payment_status', 'paid')
      .gte('created_at', sinceIso),
    sb
      .from('orders')
      .select('total_amount')
      .in('payment_method', ['pay_on_delivery', 'pay_on_pickup'])
      .gte('created_at', sinceIso)
      .not('status', 'in', `(${terminalList})`),
    sb
      .from('orders')
      .select('id, total_amount')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .gte('completed_at', sinceIso),
    sb
      .from('orders')
      .select('id, total_amount')
      .eq('status', 'completed')
      .is('completed_at', null)
      .gte('updated_at', sinceIso),
  ]);

  if (mpRes.error) return { data: emptyPeriod(), error: new Error(mpRes.error.message) };
  if (payOnRes.error) return { data: emptyPeriod(), error: new Error(payOnRes.error.message) };
  if (completedWithDate.error) return { data: emptyPeriod(), error: new Error(completedWithDate.error.message) };
  if (completedLegacy.error) return { data: emptyPeriod(), error: new Error(completedLegacy.error.message) };

  const mercadoPagoPaidTotal = (mpRes.data ?? []).reduce((s, r) => s + parseAmount(r.total_amount), 0);
  const payOnFulfillmentCommitmentTotal = (payOnRes.data ?? []).reduce(
    (s, r) => s + parseAmount(r.total_amount),
    0
  );

  const byId = new Map<string, { total_amount: string }>();
  for (const r of completedWithDate.data ?? []) {
    byId.set(r.id, { total_amount: r.total_amount });
  }
  for (const r of completedLegacy.data ?? []) {
    if (!byId.has(r.id)) byId.set(r.id, { total_amount: r.total_amount });
  }
  let completedTotal = 0;
  for (const { total_amount } of byId.values()) {
    completedTotal += parseAmount(total_amount);
  }

  return {
    data: {
      mercadoPagoPaidTotal,
      payOnFulfillmentCommitmentTotal,
      completedCount: byId.size,
      completedTotal,
    },
    error: null,
  };
}

function emptyPeriod(): DashboardPeriodMoney {
  return {
    mercadoPagoPaidTotal: 0,
    payOnFulfillmentCommitmentTotal: 0,
    completedCount: 0,
    completedTotal: 0,
  };
}

type QueueRow = {
  id: string;
  public_code: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  customers:
    | { full_name: string; phone: string | null }
    | { full_name: string; phone: string | null }[]
    | null;
};

function normalizeCustomer(
  c: QueueRow['customers']
): { full_name: string; phone: string | null } | null {
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

export async function loadDashboardData(
  sb: SupabaseClient
): Promise<{ ok: true; data: DashboardData } | { ok: false; error: string }> {
  const since7 = isoStartUtcDaysAgo(7);
  const since30 = isoStartUtcDaysAgo(30);

  const [
    awaitingApprovalRes,
    pendingPaymentRes,
    inProgressRes,
    openPipelineRes,
    attentionRes,
    finance7,
    finance30,
    activeProducts,
    inactiveProducts,
    importRes,
  ] = await Promise.all([
    sb.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_approval'),
    sb.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_payment'),
    sb.from('orders').select('*', { count: 'exact', head: true }).in('status', [...IN_PROGRESS_STATUSES]),
    sb.from('orders').select('*', { count: 'exact', head: true }).in('status', [...DASHBOARD_OPEN_ORDER_STATUSES]),
    sb
      .from('orders')
      .select(
        'id, public_code, status, payment_status, total_amount, created_at, customers ( full_name, phone )'
      )
      .in('status', [...ATTENTION_STATUSES])
      .order('created_at', { ascending: false })
      .limit(10),
    loadPeriodMoney(sb, since7),
    loadPeriodMoney(sb, since30),
    countProducts(sb, true),
    countProducts(sb, false),
    sb
      .from('imports_log')
      .select('file_name, status, imported_rows, failed_rows, finished_at, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const countSnap = [
    awaitingApprovalRes,
    pendingPaymentRes,
    inProgressRes,
    openPipelineRes,
    activeProducts,
    inactiveProducts,
  ];
  const firstCountErr = countSnap.find((r) => r.error)?.error;
  if (firstCountErr) return { ok: false, error: firstCountErr.message };

  if (attentionRes.error) return { ok: false, error: attentionRes.error.message };
  if (finance7.error) return { ok: false, error: finance7.error.message };
  if (finance30.error) return { ok: false, error: finance30.error.message };
  if (importRes.error) return { ok: false, error: importRes.error.message };

  const queueRows = (attentionRes.data ?? []) as unknown as QueueRow[];
  const attentionQueue: DashboardAttentionOrder[] = queueRows.map((row) => {
    const cust = normalizeCustomer(row.customers);
    return {
      id: row.id,
      public_code: row.public_code,
      status: row.status,
      payment_status: row.payment_status,
      total_amount: row.total_amount,
      created_at: row.created_at,
      customer_name: cust?.full_name ?? null,
      customer_phone: cust?.phone ?? null,
    };
  });

  const last = importRes.data as DashboardImportRow | null;

  return {
    ok: true,
    data: {
      kpis: {
        awaitingApproval: awaitingApprovalRes.count ?? 0,
        pendingPayment: pendingPaymentRes.count ?? 0,
        inProgress: inProgressRes.count ?? 0,
        openPipeline: openPipelineRes.count ?? 0,
      },
      attentionQueue,
      finance: {
        last7Days: finance7.data,
        last30Days: finance30.data,
      },
      catalog: {
        productsActive: activeProducts.count,
        productsInactive: inactiveProducts.count,
      },
      lastImport: last,
    },
  };
}
