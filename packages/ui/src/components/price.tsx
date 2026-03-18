import * as React from 'react';
import { cn } from '../lib/utils';
import { formatCurrency } from '@flordoestudante/utils';

export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  compareAt?: number | null;
  currency?: string;
  locale?: string;
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  default: 'text-base',
  lg: 'text-lg font-semibold',
};

const Price = React.forwardRef<HTMLSpanElement, PriceProps>(
  ({ className, value, compareAt, currency = 'BRL', locale = 'pt-BR', size = 'default', ...props }, ref) => {
    const hasDiscount = compareAt != null && compareAt > value;
    return (
      <span ref={ref} className={cn('inline-flex items-baseline gap-2', sizeClasses[size], className)} {...props}>
        <span>{formatCurrency(value, { currency, locale })}</span>
        {hasDiscount && (
          <span className="text-muted-foreground line-through text-sm">
            {formatCurrency(compareAt, { currency, locale })}
          </span>
        )}
      </span>
    );
  }
);
Price.displayName = 'Price';

export { Price };
