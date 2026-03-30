'use client';

import type { SubscriptionPlanCard as PlanCardModel } from '../types';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';

type Props = {
  plans: PlanCardModel[];
};

export function SubscriptionPlanGrid({ plans }: Props) {
  if (plans.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Nenhum plano de assinatura disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <SubscriptionPlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
