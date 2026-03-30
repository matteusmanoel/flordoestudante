import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscriptionCheckoutClient } from './SubscriptionCheckoutClient';
import type { SubscriptionFrequency } from '@flordoestudante/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — Assinatura | Flor do Estudante',
};

type Props = {
  searchParams: { plan_id?: string; addons?: string };
};

interface PlanRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  frequency: SubscriptionFrequency;
  short_description: string | null;
}

interface AddonRow {
  id: string;
  name: string;
  price: number;
}

export default async function SubscriptionCheckoutPage({ searchParams }: Props) {
  const planId = searchParams.plan_id;
  if (!planId) redirect('/assinaturas');

  const supabase = createServerSupabaseClient();
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id, name, slug, price, frequency, short_description')
    .eq('id', planId)
    .eq('is_active', true)
    .single();

  if (!plan) redirect('/assinaturas');
  const typedPlan = plan as unknown as PlanRow;

  const addonIdsCsv = searchParams.addons ?? '';
  const addonIds = addonIdsCsv ? addonIdsCsv.split(',').filter(Boolean) : [];

  let addons: { id: string; name: string; price: number }[] = [];
  if (addonIds.length > 0) {
    const { data: addonRows } = await supabase
      .from('addons')
      .select('id, name, price')
      .in('id', addonIds)
      .eq('is_active', true);
    addons = ((addonRows ?? []) as unknown as AddonRow[]).map((a) => ({
      id: a.id,
      name: a.name,
      price: Number(a.price),
    }));
  }

  return (
    <SubscriptionCheckoutClient
      plan={{ id: typedPlan.id, name: typedPlan.name, slug: typedPlan.slug, price: Number(typedPlan.price), frequency: typedPlan.frequency }}
      addons={addons}
    />
  );
}
