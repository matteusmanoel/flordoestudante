'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@flordoestudante/utils';

type Props = {
  href?: string;
  thumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AdminEntityCard({
  href,
  thumb,
  title,
  subtitle,
  badges,
  meta,
  actions,
  className,
}: Props) {
  const main = (
    <div className="flex min-w-0 flex-1 gap-3 p-3">
      {thumb ? <div className="shrink-0">{thumb}</div> : null}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{title}</span>
          {badges}
        </div>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        className
      )}
    >
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 hover:bg-muted/40">
          {main}
        </Link>
      ) : (
        main
      )}
      {actions ? (
        <div className="flex shrink-0 items-start border-l border-border/60 p-1">{actions}</div>
      ) : null}
    </div>
  );
}
