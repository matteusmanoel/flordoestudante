'use client';

import Link from 'next/link';
import { SUBSCRIPTION_FREQUENCY_LABELS } from '@flordoestudante/core';
import { formatCurrency } from '@flordoestudante/utils';
import { Badge, DropdownMenuItem } from '@flordoestudante/ui';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminRowActionsMenu } from './AdminRowActionsMenu';
import { TogglePlanDropdownItem } from '@/app/admin/planos/TogglePlanButton';

export type AdminPlanListRow = {
  id: string;
  name: string;
  frequency: string;
  price: number;
  cover_image_url: string | null;
  is_active: boolean;
};

export function AdminPlansMobileCards({ plans }: { plans: AdminPlanListRow[] }) {
  if (plans.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum plano cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const freqLabel =
          SUBSCRIPTION_FREQUENCY_LABELS[plan.frequency as keyof typeof SUBSCRIPTION_FREQUENCY_LABELS] ??
          plan.frequency;
        return (
          <AdminEntityCard
            key={plan.id}
            href={`/admin/planos/${plan.id}`}
            thumb={
              <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                <MediaThumb
                  src={plan.cover_image_url}
                  alt={plan.name}
                  fill
                  sizes="56px"
                  imageClassName="object-cover"
                />
              </div>
            }
            title={plan.name}
            subtitle={<span>{freqLabel}</span>}
            badges={
              <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
                {plan.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            }
            meta={<span>{formatCurrency(plan.price)}</span>}
            actions={
              <AdminRowActionsMenu>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/planos/${plan.id}`}>Editar</Link>
                </DropdownMenuItem>
                <TogglePlanDropdownItem id={plan.id} isActive={plan.is_active} />
              </AdminRowActionsMenu>
            }
          />
        );
      })}
    </div>
  );
}
