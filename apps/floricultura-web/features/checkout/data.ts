/**
 * Acesso a dados do checkout (server-only).
 * Regra de entrega ativa e preparação para persistência.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ShippingRuleOption } from './types';

function getClientOrNull() {
  try {
    return createServerSupabaseClient();
  } catch {
    return null;
  }
}

interface ShippingRuleRow {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

/**
 * Retorna a primeira regra de entrega ativa (por sort_order).
 * MVP: uma única regra fixa; se houver várias ativas, usa a primeira.
 */
export async function getActiveShippingRule(): Promise<ShippingRuleOption | null> {
  const client = getClientOrNull();
  if (!client) return null;
  const { data, error } = await client
    .from('shipping_rules')
    .select('id, name, amount, description')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as ShippingRuleRow;
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    description: row.description,
  };
}
