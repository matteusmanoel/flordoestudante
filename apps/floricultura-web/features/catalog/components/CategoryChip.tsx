'use client';

import Link from 'next/link';
import { cn } from '@flordoestudante/utils';
import type { CategoryCard } from '../types';

type CategoryChipProps = {
  category: CategoryCard;
  isActive?: boolean;
  className?: string;
};

export function CategoryChip({ category, isActive, className }: CategoryChipProps) {
  const href = !category.slug ? '/catalogo' : `/catalogo?categoria=${category.slug}`;
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent',
        className
      )}
    >
      {category.name}
      {category.productCount != null && (
        <span className={cn('ml-1.5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          ({category.productCount})
        </span>
      )}
    </Link>
  );
}
