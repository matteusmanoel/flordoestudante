'use client';

import Link from 'next/link';
import { Price, Badge } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
import type { SubscriptionPlanCard as PlanCardModel } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';

type Props = {
  plan: PlanCardModel;
  className?: string;
};

export function SubscriptionPlanCard({ plan, className }: Props) {
  const rawUrl = plan.coverImageUrl?.trim() || '';

  return (
    <Link
      href={`/assinaturas/${plan.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5',
        plan.isFeatured && 'ring-2 ring-primary/30',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        <MediaThumb
          src={rawUrl}
          alt={plan.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {plan.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
            Popular
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Badge variant="secondary" className="mb-2 w-fit text-xs">
          {plan.frequencyLabel}
        </Badge>
        <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-primary transition-colors">
          {plan.name}
        </h3>
        {plan.shortDescription && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {plan.shortDescription}
          </p>
        )}
        <div className="mt-4 flex items-baseline gap-1">
          <Price value={plan.price} className="text-xl font-semibold" />
          <span className="text-sm text-muted-foreground">/{plan.frequencyLabel.toLowerCase()}</span>
        </div>
      </div>
    </Link>
  );
}
