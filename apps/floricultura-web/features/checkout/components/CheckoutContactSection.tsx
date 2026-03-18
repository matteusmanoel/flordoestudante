'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input, Label } from '@flordoestudante/ui';
import type { CheckoutFormValues } from '../schema';

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function CheckoutContactSection({ register, errors }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-medium text-foreground">Contato</h3>
      <div className="grid gap-4 sm:grid-cols-1">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo *</Label>
          <Input
            id="full_name"
            placeholder="Seu nome"
            {...register('full_name')}
            className={errors.full_name ? 'border-destructive' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...register('phone')}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Informe pelo menos telefone ou e-mail.</p>
    </div>
  );
}
