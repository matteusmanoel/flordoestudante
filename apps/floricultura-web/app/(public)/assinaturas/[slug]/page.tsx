import { notFound } from 'next/navigation';
import { getSubscriptionPlanBySlug } from '@/features/subscriptions/data';
import { SubscriptionPlanDetailClient } from './SubscriptionPlanDetailClient';
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = await getSubscriptionPlanBySlug(params.slug);
  if (!plan) return { title: 'Plano não encontrado' };
  return {
    title: `${plan.name} | Assinaturas | Flor do Estudante`,
    description: plan.shortDescription ?? plan.description ?? undefined,
  };
}

export default async function SubscriptionPlanPage({ params }: Props) {
  const plan = await getSubscriptionPlanBySlug(params.slug);
  if (!plan) notFound();

  return <SubscriptionPlanDetailClient plan={plan} />;
}
