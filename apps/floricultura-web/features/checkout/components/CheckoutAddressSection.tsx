'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input, Label } from '@flordoestudante/ui';
import type { CheckoutFormValues } from '../schema';

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function CheckoutAddressSection({ register, errors }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-medium text-foreground">Endereço de entrega</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address.recipient_name">Nome do destinatário *</Label>
          <Input
            id="address.recipient_name"
            placeholder="Nome de quem recebe"
            {...register('address.recipient_name')}
            className={errors.address?.recipient_name ? 'border-destructive' : ''}
          />
          {errors.address?.recipient_name && (
            <p className="text-sm text-destructive">{errors.address.recipient_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.phone">Telefone *</Label>
          <Input
            id="address.phone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...register('address.phone')}
            className={errors.address?.phone ? 'border-destructive' : ''}
          />
          {errors.address?.phone && (
            <p className="text-sm text-destructive">{errors.address.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.postal_code">CEP *</Label>
          <Input
            id="address.postal_code"
            placeholder="00000-000"
            {...register('address.postal_code')}
            className={errors.address?.postal_code ? 'border-destructive' : ''}
          />
          {errors.address?.postal_code && (
            <p className="text-sm text-destructive">{errors.address.postal_code.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address.street">Rua *</Label>
          <Input
            id="address.street"
            placeholder="Rua, avenida"
            {...register('address.street')}
            className={errors.address?.street ? 'border-destructive' : ''}
          />
          {errors.address?.street && (
            <p className="text-sm text-destructive">{errors.address.street.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.number">Número *</Label>
          <Input
            id="address.number"
            placeholder="Nº"
            {...register('address.number')}
            className={errors.address?.number ? 'border-destructive' : ''}
          />
          {errors.address?.number && (
            <p className="text-sm text-destructive">{errors.address.number.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.complement">Complemento</Label>
          <Input
            id="address.complement"
            placeholder="Apto, bloco"
            {...register('address.complement')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.neighborhood">Bairro *</Label>
          <Input
            id="address.neighborhood"
            placeholder="Bairro"
            {...register('address.neighborhood')}
            className={errors.address?.neighborhood ? 'border-destructive' : ''}
          />
          {errors.address?.neighborhood && (
            <p className="text-sm text-destructive">{errors.address.neighborhood.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.city">Cidade *</Label>
          <Input
            id="address.city"
            placeholder="Cidade"
            {...register('address.city')}
            className={errors.address?.city ? 'border-destructive' : ''}
          />
          {errors.address?.city && (
            <p className="text-sm text-destructive">{errors.address.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address.state">UF *</Label>
          <Input
            id="address.state"
            placeholder="SP"
            maxLength={2}
            {...register('address.state')}
            className={errors.address?.state ? 'border-destructive' : ''}
          />
          {errors.address?.state && (
            <p className="text-sm text-destructive">{errors.address.state.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address.reference">Ponto de referência</Label>
          <Input
            id="address.reference"
            placeholder="Opcional"
            {...register('address.reference')}
          />
        </div>
      </div>
    </div>
  );
}
