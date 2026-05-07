'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input, Label } from '@flordoestudante/ui';
import type { CheckoutFormValues } from '../schema';

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function CheckoutPickupRecipientSection({ register, errors }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-medium text-foreground">
        Dados do destinatário para retirada
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pickup_recipient_name">Nome do destinatário *</Label>
          <Input
            id="pickup_recipient_name"
            placeholder="Nome de quem vai retirar"
            {...register('pickup_recipient_name')}
            className={errors.pickup_recipient_name ? 'border-destructive' : ''}
          />
          {errors.pickup_recipient_name && (
            <p className="text-xs text-destructive">{errors.pickup_recipient_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickup_phone">Telefone do destinatário *</Label>
          <Input
            id="pickup_phone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...register('pickup_phone')}
            className={errors.pickup_phone ? 'border-destructive' : ''}
          />
          {errors.pickup_phone && (
            <p className="text-xs text-destructive">{errors.pickup_phone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
