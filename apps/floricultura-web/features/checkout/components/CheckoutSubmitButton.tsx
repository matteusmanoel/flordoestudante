'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@flordoestudante/ui';

type Props = {
  disabled?: boolean;
  isSubmitting: boolean;
};

export function CheckoutSubmitButton({ disabled, isSubmitting }: Props) {
  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      className="inline-flex w-full min-w-[200px] items-center justify-center gap-2 sm:w-auto"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Finalizando…
        </>
      ) : (
        'Finalizar pedido'
      )}
    </Button>
  );
}
