'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createSubscriptionCheckout } from '@/lib/stripe/create-checkout';
import { getStripeSecretKey } from '@/lib/stripe/config';
import { SUBSCRIPTION_STATUS } from '@flordoestudante/core';
import type { SubscriptionFrequency } from '@flordoestudante/core';
import { subscriptionCheckoutSchema } from './checkout-schema';

export interface SubscriptionCheckoutInput {
  planId: string;
  addonIds: string[];
  fullName: string;
  phone: string;
  email: string;
  address: {
    recipient_name: string;
    phone: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
  };
  customerNote?: string;
  giftMessage?: string;
}

export async function processSubscriptionCheckout(input: SubscriptionCheckoutInput) {
  if (!getStripeSecretKey()) {
    return { success: false as const, message: 'Stripe não configurado. Contate a loja.' };
  }

  const parsed = subscriptionCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false as const,
      message: firstIssue?.message ?? 'Confira os dados e tente novamente.',
    };
  }
  const data = parsed.data;

  const supabase = createServerSupabaseClient();

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id, name, slug, price, frequency')
    .eq('id', data.planId)
    .eq('is_active', true)
    .single();

  if (!plan) {
    return { success: false as const, message: 'Plano não encontrado.' };
  }

  let addons: { id: string; name: string; price: number }[] = [];
  if (data.addonIds.length > 0) {
    const { data: addonRows } = await supabase
      .from('addons')
      .select('id, name, price')
      .in('id', data.addonIds)
      .eq('is_active', true);
    addons = (addonRows ?? []).map((a) => ({
      id: (a as { id: string }).id,
      name: (a as { name: string }).name,
      price: Number((a as { price: number }).price),
    }));
  }

  let customerId: string;
  const phone = data.phone?.trim() || null;
  const email = data.email?.trim() || null;

  const existingByEmail = email
    ? await supabase.from('customers').select('id').eq('email', email).maybeSingle()
    : { data: null };
  const existingByPhone = phone
    ? await supabase.from('customers').select('id').eq('phone', phone).maybeSingle()
    : { data: null };

  const existing = (existingByEmail.data ?? existingByPhone.data) as { id: string } | null;
  if (existing) {
    customerId = existing.id;
    await supabase
      .from('customers')
      .update({ full_name: data.fullName.trim(), phone, email })
      .eq('id', customerId);
  } else {
    const { data: newCustomer, error: errCustomer } = await supabase
      .from('customers')
      .insert({ full_name: data.fullName.trim(), phone, email })
      .select('id')
      .single();
    if (errCustomer || !newCustomer) {
      return { success: false as const, message: 'Não foi possível registrar o cliente.' };
    }
    customerId = (newCustomer as { id: string }).id;
  }

  const customerNoteParts = [data.customerNote?.trim(), data.giftMessage?.trim()]
    .filter(Boolean)
    .map((v, idx) => (idx === 1 ? `Mensagem no cartão: ${v}` : v));
  const customerNoteCombined = customerNoteParts.join(' | ') || null;

  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .insert({
      plan_id: plan.id,
      customer_id: customerId,
      status: SUBSCRIPTION_STATUS.PENDING_PAYMENT,
      address_snapshot_json: data.address,
      customer_note: customerNoteCombined,
    })
    .select('id')
    .single();

  if (subErr || !sub) {
    return { success: false as const, message: 'Não foi possível criar a assinatura.' };
  }

  const subscriptionId = (sub as { id: string }).id;

  try {
    const result = await createSubscriptionCheckout({
      planName: plan.name,
      planPrice: Number(plan.price),
      frequency: plan.frequency as SubscriptionFrequency,
      addons: addons.map((a) => ({ name: a.name, price: a.price })),
      customerEmail: email ?? undefined,
      customerName: data.fullName,
      customerPhone: data.phone,
      planSlug: plan.slug,
      metadata: {
        subscription_id: subscriptionId,
        plan_id: plan.id,
        customer_id: customerId,
        addon_ids: data.addonIds.join(','),
      },
    });

    return { success: true as const, checkoutUrl: result.url, subscriptionId };
  } catch (e) {
    await supabase.from('subscriptions').delete().eq('id', subscriptionId);
    return {
      success: false as const,
      message: e instanceof Error ? e.message : 'Erro ao criar sessão de pagamento.',
    };
  }
}
