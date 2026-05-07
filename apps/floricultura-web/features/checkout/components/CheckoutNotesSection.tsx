'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label, Textarea } from '@flordoestudante/ui';
import { Gift } from 'lucide-react';
import type { CheckoutFormValues } from '../schema';

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function CheckoutNotesSection({ register, errors }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="font-display text-lg font-medium text-foreground">Observações do pedido</h3>

      {/* Mensagem de cartão — destaque visual */}
      <div className="rounded-xl border border-accent/60 bg-accent/15 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-accent-foreground" />
          <Label htmlFor="gift_message" className="text-sm font-medium text-foreground">
            Mensagem para o cartão
          </Label>
          <span className="text-xs text-muted-foreground">(opcional)</span>
        </div>
        <Textarea
          id="gift_message"
          placeholder="Ex: Feliz aniversário! Com muito carinho e amor..."
          rows={3}
          {...register('gift_message')}
          className={`bg-background ${errors.gift_message ? 'border-destructive' : 'border-border/60'}`}
        />
        {errors.gift_message && (
          <p className="mt-1 text-xs text-destructive">{errors.gift_message.message}</p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          A mensagem será incluída em um cartão junto com o pedido.
        </p>
      </div>

      {/* Observações gerais */}
      <div className="space-y-2">
        <Label htmlFor="customer_note" className="text-sm font-medium">
          Observações gerais
          <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="customer_note"
          placeholder="Horário preferido, instruções de entrega, cor favorita..."
          rows={2}
          {...register('customer_note')}
          className={errors.customer_note ? 'border-destructive' : ''}
        />
        {errors.customer_note && (
          <p className="mt-1 text-xs text-destructive">{errors.customer_note.message}</p>
        )}
      </div>
    </div>
  );
}
