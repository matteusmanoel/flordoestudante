import * as React from 'react';
import { Badge, type BadgeProps } from './badge';
import { cn } from '../lib/utils';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
  label?: string;
  variantMap?: Record<string, BadgeProps['variant']>;
}

const defaultVariantMap: Record<string, BadgeProps['variant']> = {
  draft: 'secondary',
  pending_payment: 'outline',
  paid: 'default',
  awaiting_approval: 'outline',
  approved: 'default',
  in_production: 'default',
  ready_for_pickup: 'default',
  out_for_delivery: 'default',
  completed: 'default',
  cancelled: 'destructive',
  expired: 'destructive',
  pending: 'outline',
  authorized: 'secondary',
  failed: 'destructive',
  refunded_manual: 'secondary',
};

function StatusBadge({ status, label, variantMap = defaultVariantMap, className, ...props }: StatusBadgeProps) {
  const variant = variantMap[status] ?? 'secondary';
  return (
    <Badge variant={variant} className={cn('capitalize', className)} {...props}>
      {label ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}

export { StatusBadge };
