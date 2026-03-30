'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Price, Badge } from '@flordoestudante/ui';
import { AddonPicker } from '@/features/subscriptions/components/AddonPicker';
import type { SubscriptionPlanDetail } from '@/features/subscriptions/types';
import { formatCurrency } from '@flordoestudante/utils';

import { MediaThumb } from '@/components/shared/MediaThumb';

type Props = {
  plan: SubscriptionPlanDetail;
};

export function SubscriptionPlanDetailClient({ plan }: Props) {
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const addonsTotal = plan.addons
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const total = plan.price + addonsTotal;

  const rawUrl = plan.coverImageUrl?.trim() || '';

  const checkoutParams = new URLSearchParams({
    plan_id: plan.id,
    ...(selectedAddonIds.length > 0 ? { addons: selectedAddonIds.join(',') } : {}),
  });

  return (
    <div className="container max-w-4xl px-4 py-8 md:py-14">
      <Link
        href="/assinaturas"
        className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Voltar para planos
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted/30">
          <MediaThumb
            src={rawUrl}
            alt={plan.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col">
          <Badge variant="secondary" className="mb-3 w-fit">
            {plan.frequencyLabel}
          </Badge>

          <h1 className="font-serif text-2xl font-medium md:text-3xl">{plan.name}</h1>

          {plan.shortDescription && (
            <p className="mt-2 text-muted-foreground leading-relaxed">{plan.shortDescription}</p>
          )}

          <div className="mt-4 flex items-baseline gap-1.5">
            <Price value={plan.price} className="text-2xl font-semibold" />
            <span className="text-muted-foreground">/{plan.frequencyLabel.toLowerCase()}</span>
          </div>

          {plan.description && (
            <div className="mt-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {plan.description}
            </div>
          )}

          {plan.addons.length > 0 && (
            <div className="mt-6">
              <AddonPicker
                addons={plan.addons}
                selectedIds={selectedAddonIds}
                onChange={setSelectedAddonIds}
              />
            </div>
          )}

          <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano ({plan.frequencyLabel.toLowerCase()})</span>
              <span>{formatCurrency(plan.price)}</span>
            </div>
            {addonsTotal > 0 && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Complementos</span>
                <span>+ {formatCurrency(addonsTotal)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 font-medium">
              <span>Total por ciclo</span>
              <span className="text-lg">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button asChild size="lg" className="mt-6 w-full">
            <Link href={`/assinaturas/checkout?${checkoutParams.toString()}`}>
              Assinar agora
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
