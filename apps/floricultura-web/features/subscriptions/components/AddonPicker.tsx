'use client';

import { useState } from 'react';
import { Price, Checkbox } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
import type { AddonViewModel } from '../types';
import { MediaThumb } from '@/components/shared/MediaThumb';

type Props = {
  addons: AddonViewModel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
};

export function AddonPicker({ addons, selectedIds, onChange, className }: Props) {
  if (addons.length === 0) return null;

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="font-serif text-lg font-medium">Adicionar complementos</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {addons.map((addon) => {
          const checked = selectedIds.includes(addon.id);
          return (
            <label
              key={addon.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(addon.id)}
                className="mt-0.5"
              />
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted/50">
                <MediaThumb src={addon.coverImageUrl} alt={addon.name} fill sizes="44px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{addon.name}</p>
                {addon.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{addon.description}</p>
                )}
              </div>
              <Price value={addon.price} className="text-sm font-medium whitespace-nowrap" />
            </label>
          );
        })}
      </div>
    </div>
  );
}
