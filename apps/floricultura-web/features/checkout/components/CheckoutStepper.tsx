'use client';

import { cn } from '@flordoestudante/utils';

export type CheckoutStepMeta = {
  id: number;
  label: string;
};

type Props = {
  steps: CheckoutStepMeta[];
  currentStep: number;
  className?: string;
};

export function CheckoutStepper({ steps, currentStep, className }: Props) {
  return (
    <nav aria-label="Etapas do checkout" className={cn('w-full', className)}>
      <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        {steps.map((s, i) => {
          const active = s.id === currentStep;
          const done = s.id < currentStep;
          return (
            <li key={s.id} className="flex items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                  active && 'border-primary bg-primary text-primary-foreground shadow-sm',
                  done && 'border-primary/40 bg-primary/10 text-primary',
                  !active && !done && 'border-border bg-muted/40 text-muted-foreground'
                )}
              >
                {s.id}
              </span>
              <span
                className={cn(
                  'text-sm',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className="mx-1 hidden h-px w-6 bg-border sm:block lg:w-10"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
