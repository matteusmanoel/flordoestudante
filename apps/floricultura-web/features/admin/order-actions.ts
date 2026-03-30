'use server';

import { ORDER_STATUS, type OrderStatus } from '@flordoestudante/core';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdminSession } from './session';

const STATUSES = new Set<string>(Object.values(ORDER_STATUS));

async function recalcOrderTotals(sb: ReturnType<typeof createServerSupabaseClient>, orderId: string) {
  const { data: order } = await sb
    .from('orders')
    .select('shipping_amount, discount_amount')
    .eq('id', orderId)
    .single();
  if (!order) return;
  const { data: items } = await sb.from('order_items').select('line_total').eq('order_id', orderId);
  const subtotal = (items ?? []).reduce((s, row) => s + Number((row as { line_total: string }).line_total), 0);
  const ship = Number((order as { shipping_amount: string }).shipping_amount);
  const disc = Number((order as { discount_amount: string }).discount_amount);
  const total = subtotal + ship - disc;
  await sb
    .from('orders')
    .update({
      subtotal_amount: subtotal,
      total_amount: total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}

export async function updateOrderAdminAction(
  orderId: string,
  input: {
    status: string;
    estimated_fulfillment_text: string;
    admin_note: string;
  }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { admin } = await requireAdminSession();
  if (!STATUSES.has(input.status)) {
    return { ok: false, message: 'Status inválido.' };
  }
  const status = input.status as OrderStatus;
  const sb = createServerSupabaseClient();

  const { data: current, error: fetchErr } = await sb
    .from('orders')
    .select('status, approved_at, cancelled_at, completed_at')
    .eq('id', orderId)
    .single();
  if (fetchErr || !current) {
    return { ok: false, message: 'Pedido não encontrado.' };
  }

  const oldStatus = (current as { status: string }).status;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    estimated_fulfillment_text: input.estimated_fulfillment_text.trim() || null,
    admin_note: input.admin_note.trim() || null,
    updated_at: now,
  };

  if (status === ORDER_STATUS.APPROVED && !(current as { approved_at: string | null }).approved_at) {
    patch.approved_at = now;
  }
  if (status === ORDER_STATUS.CANCELLED) {
    patch.cancelled_at = now;
  }
  if (status === ORDER_STATUS.COMPLETED) {
    patch.completed_at = now;
  }

  const { error: upErr } = await sb.from('orders').update(patch).eq('id', orderId);
  if (upErr) {
    return { ok: false, message: upErr.message };
  }

  if (oldStatus !== status) {
    await sb.from('order_status_history').insert({
      order_id: orderId,
      old_status: oldStatus,
      new_status: status,
      changed_by_type: 'admin',
      changed_by_id: admin.id,
      notes: null,
    });
  }

  return { ok: true };
}

export async function setOrderItemQuantityAction(
  orderId: string,
  itemId: string,
  quantity: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdminSession();
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return { ok: false, message: 'Quantidade entre 1 e 99.' };
  }
  const sb = createServerSupabaseClient();
  const { data: item, error } = await sb
    .from('order_items')
    .select('order_id, unit_price_snapshot')
    .eq('id', itemId)
    .single();
  if (error || !item || (item as { order_id: string }).order_id !== orderId) {
    return { ok: false, message: 'Item inválido.' };
  }
  const unit = Number((item as { unit_price_snapshot: string }).unit_price_snapshot);
  const lineTotal = Math.round(unit * quantity * 100) / 100;
  const { error: u2 } = await sb
    .from('order_items')
    .update({
      quantity,
      line_total: lineTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);
  if (u2) return { ok: false, message: u2.message };
  await recalcOrderTotals(sb, orderId);
  return { ok: true };
}

export async function replaceOrderItemProductAction(
  orderId: string,
  itemId: string,
  productId: string,
  quantity: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdminSession();
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return { ok: false, message: 'Quantidade entre 1 e 99.' };
  }
  const sb = createServerSupabaseClient();
  const { data: item } = await sb.from('order_items').select('order_id').eq('id', itemId).single();
  if (!item || (item as { order_id: string }).order_id !== orderId) {
    return { ok: false, message: 'Item inválido.' };
  }
  const { data: product, error: pe } = await sb
    .from('products')
    .select('id, name, price')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();
  if (pe || !product) {
    return { ok: false, message: 'Produto não encontrado.' };
  }
  const p = product as { id: string; name: string; price: string };
  const unit = Number(p.price);
  const lineTotal = Math.round(unit * quantity * 100) / 100;
  const { error: u2 } = await sb
    .from('order_items')
    .update({
      product_id: p.id,
      product_name_snapshot: p.name,
      unit_price_snapshot: unit,
      quantity,
      line_total: lineTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);
  if (u2) return { ok: false, message: u2.message };
  await recalcOrderTotals(sb, orderId);
  return { ok: true };
}
