'use client';

import { Skeleton } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';

type ProductCardSkeletonProps = {
  className?: string;
};

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border/50 bg-card', className)}>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-5 w-3/4" />
        <Skeleton className="mt-3 h-5 w-24" />
      </div>
    </div>
  );
}
