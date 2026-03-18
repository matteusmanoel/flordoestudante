'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label, Textarea } from '@flordoestudante/ui';
import type { CheckoutFormValues } from '../schema';

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function CheckoutNotesSection({ register, errors }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-medium text-foreground">Observações</h3>
      <div className="space-y-2">
        <Label htmlFor="customer_note">Observação do pedido</Label>
        <Textarea
          id="customer_note"
          placeholder="Horário preferido, instruções de entrega..."
          rows={2}
          {...register('customer_note')}
          className={errors.customer_note ? 'border-destructive' : ''}
        />
        {errors.customer_note && (
          <p className="text-sm text-destructive">{errors.customer_note.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gift_message">Mensagem para cartão / presente (opcional)</Label>
        <Textarea
          id="gift_message"
          placeholder="Dedicação para o presente..."
          rows={2}
          {...register('gift_message')}
          className={errors.gift_message ? 'border-destructive' : ''}
        />
        {errors.gift_message && (
          <p className="text-sm text-destructive">{errors.gift_message.message}</p>
        )}
      </div>
    </div>
  );
}
