'use client';

import { Loader2, HeartHandshake } from 'lucide-react';
import { Button } from '@flordoestudante/ui';

type Props = {
  disabled?: boolean;
  isSubmitting: boolean;
};

export function CheckoutSubmitButton({ disabled, isSubmitting }: Props) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || isSubmitting}
      className="group w-full rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[240px]"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Finalizando com carinho…
        </>
      ) : (
        <>
          <HeartHandshake
            className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
            aria-hidden
          />
          Confirmar pedido com carinho
        </>
      )}
    </Button>
  );
}
