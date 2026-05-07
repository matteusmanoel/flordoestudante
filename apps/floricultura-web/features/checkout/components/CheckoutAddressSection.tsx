'use client';

import { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Input, Label } from '@flordoestudante/ui';
import { toast } from 'sonner';
import { cn } from '@flordoestudante/utils';
import { fetchAddressByCep } from '@/lib/viacep';
import type { CheckoutFormValues } from '../schema';

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  setValue?: UseFormSetValue<CheckoutFormValues>;
};

export function CheckoutAddressSection({ register, errors, setValue }: Props) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value?.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setExpanded(true);

    if (!setValue) return;
    setLoadingCep(true);
    try {
      const data = await fetchAddressByCep(cep);
      if (data) {
        setValue('address.street', data.logradouro ?? '', { shouldValidate: true });
        setValue('address.neighborhood', data.bairro ?? '', { shouldValidate: true });
        setValue('address.city', data.localidade ?? '', { shouldValidate: true });
        setValue('address.state', (data.uf ?? '').toUpperCase(), { shouldValidate: true });
        toast.success('Endereço preenchido automaticamente.');
      }
    } catch {
      toast.error('Não foi possível buscar o CEP.');
    } finally {
      setLoadingCep(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-medium text-foreground">Endereço de entrega</h3>

      {/* Campos sempre visíveis: destinatário, telefone, CEP, número */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="address.recipient_name">Nome do destinatário *</Label>
          <Input
            id="address.recipient_name"
            placeholder="Nome de quem recebe"
            {...register('address.recipient_name')}
            className={errors.address?.recipient_name ? 'border-destructive' : ''}
          />
          {errors.address?.recipient_name && (
            <p className="text-xs text-destructive">{errors.address.recipient_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address.phone">Telefone *</Label>
          <Input
            id="address.phone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...register('address.phone')}
            className={errors.address?.phone ? 'border-destructive' : ''}
          />
          {errors.address?.phone && (
            <p className="text-xs text-destructive">{errors.address.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address.postal_code">CEP *</Label>
          <Input
            id="address.postal_code"
            placeholder="00000-000"
            {...register('address.postal_code')}
            onBlur={handleCepBlur}
            className={errors.address?.postal_code ? 'border-destructive' : ''}
            disabled={loadingCep}
          />
          {loadingCep && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
          {errors.address?.postal_code && (
            <p className="text-xs text-destructive">{errors.address.postal_code.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address.number">Número *</Label>
          <Input
            id="address.number"
            placeholder="Nº"
            {...register('address.number')}
            className={errors.address?.number ? 'border-destructive' : ''}
          />
          {errors.address?.number && (
            <p className="text-xs text-destructive">{errors.address.number.message}</p>
          )}
        </div>
      </div>

      {/* Hint quando não expandido */}
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          Preencher endereço manualmente
        </button>
      )}

      {/* Accordion: campos de endereço completo */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="grid gap-3 pt-1 sm:grid-cols-2">
          {/* Rua + UF lado a lado */}
          <div className="space-y-1.5 sm:col-span-1" style={{ gridColumn: '1' }}>
            <Label htmlFor="address.street">Rua *</Label>
            <Input
              id="address.street"
              placeholder="Rua, avenida"
              {...register('address.street')}
              className={errors.address?.street ? 'border-destructive' : ''}
            />
            {errors.address?.street && (
              <p className="text-xs text-destructive">{errors.address.street.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address.state">UF *</Label>
            <Input
              id="address.state"
              placeholder="SP"
              maxLength={2}
              {...register('address.state')}
              className={errors.address?.state ? 'border-destructive' : ''}
            />
            {errors.address?.state && (
              <p className="text-xs text-destructive">{errors.address.state.message}</p>
            )}
          </div>

          {/* Bairro + Cidade */}
          <div className="space-y-1.5">
            <Label htmlFor="address.neighborhood">Bairro *</Label>
            <Input
              id="address.neighborhood"
              placeholder="Bairro"
              {...register('address.neighborhood')}
              className={errors.address?.neighborhood ? 'border-destructive' : ''}
            />
            {errors.address?.neighborhood && (
              <p className="text-xs text-destructive">{errors.address.neighborhood.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address.city">Cidade *</Label>
            <Input
              id="address.city"
              placeholder="Cidade"
              {...register('address.city')}
              className={errors.address?.city ? 'border-destructive' : ''}
            />
            {errors.address?.city && (
              <p className="text-xs text-destructive">{errors.address.city.message}</p>
            )}
          </div>

          {/* Complemento + Ponto de referência lado a lado */}
          <div className="space-y-1.5">
            <Label htmlFor="address.complement">Complemento</Label>
            <Input
              id="address.complement"
              placeholder="Apto, bloco"
              {...register('address.complement')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address.reference">Ponto de referência</Label>
            <Input
              id="address.reference"
              placeholder="Opcional"
              {...register('address.reference')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
