'use client';

import { Button } from '@flordoestudante/ui';

type Props = {
  disabled?: boolean;
  isSubmitting: boolean;
};

export function CheckoutSubmitButton({ disabled, isSubmitting }: Props) {
  return (
    <Button type="submit" disabled={disabled || isSubmitting} className="w-full sm:w-auto min-w-[200px]">
      {isSubmitting ? 'Finalizando...' : 'Finalizar pedido'}
    </Button>
  );
}
