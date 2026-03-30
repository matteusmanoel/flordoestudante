'use client';

import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { Label, RadioGroup, RadioGroupItem } from '@flordoestudante/ui';
import { FULFILLMENT_TYPE, PAYMENT_METHOD } from '@flordoestudante/core';
import type { CheckoutFormValues } from '../schema';
import type { ShippingRuleOption } from '../types';

type FulfillmentSectionVariant = 'full' | 'delivery_only' | 'payment_only';

type Props = {
  control: Control<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  activeShippingRule: ShippingRuleOption | null;
  /** Divide o bloco em etapas do checkout: só entrega, só pagamento ou ambos. */
  variant?: FulfillmentSectionVariant;
};

export function CheckoutFulfillmentSection({
  control,
  errors,
  activeShippingRule,
  variant = 'full',
}: Props) {
  const fulfillmentType = useWatch({ control, name: 'fulfillment_type' });

  const showDelivery = variant === 'full' || variant === 'delivery_only';
  const showPayment = variant === 'full' || variant === 'payment_only';

  return (
    <div className="space-y-4">
      {showDelivery && (
        <>
          <h3 className="font-serif text-lg font-medium text-foreground">Entrega ou retirada</h3>
          <Controller
            name="fulfillment_type"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 ${!activeShippingRule ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <RadioGroupItem
                    value={FULFILLMENT_TYPE.DELIVERY}
                    id="fulfillment-delivery"
                    disabled={!activeShippingRule}
                  />
                  <span className="text-sm font-medium">Entrega</span>
                  {activeShippingRule ? (
                    <span className="text-xs text-muted-foreground">+ {activeShippingRule.name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Indisponível</span>
                  )}
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                  <RadioGroupItem value={FULFILLMENT_TYPE.PICKUP} id="fulfillment-pickup" />
                  <span className="text-sm font-medium">Retirada</span>
                  <span className="text-xs text-muted-foreground">Sem taxa</span>
                </label>
              </RadioGroup>
            )}
          />
          {errors.fulfillment_type && (
            <p className="text-sm text-destructive">{errors.fulfillment_type.message}</p>
          )}
        </>
      )}

      {showPayment && (
        <div className="space-y-2">
          <h3 className="font-serif text-lg font-medium text-foreground">Forma de pagamento</h3>
          <Controller
            name="payment_method"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-2"
              >
                <label className="flex cursor-pointer items-center gap-2 rounded border border-border px-3 py-2 has-[[data-state=checked]]:border-primary">
                  <RadioGroupItem value={PAYMENT_METHOD.MERCADO_PAGO} id="pay-mp" />
                  <span className="text-sm">PIX / Cartão (Mercado Pago)</span>
                </label>
                {/*
                MVP produção: checkout one-shot só Mercado Pago / offline — reativar com actions.ts (Stripe).
                <label className="flex cursor-pointer items-center gap-2 rounded border border-border px-3 py-2 has-[[data-state=checked]]:border-primary">
                  <RadioGroupItem value={PAYMENT_METHOD.STRIPE} id="pay-stripe" />
                  <span className="text-sm">Cartão de crédito (Stripe)</span>
                </label>
                */}
                {fulfillmentType === FULFILLMENT_TYPE.DELIVERY && (
                  <label className="flex cursor-pointer items-center gap-2 rounded border border-border px-3 py-2 has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={PAYMENT_METHOD.PAY_ON_DELIVERY} id="pay-delivery" />
                    <span className="text-sm">Pagar na entrega</span>
                  </label>
                )}
                {fulfillmentType === FULFILLMENT_TYPE.PICKUP && (
                  <label className="flex cursor-pointer items-center gap-2 rounded border border-border px-3 py-2 has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={PAYMENT_METHOD.PAY_ON_PICKUP} id="pay-pickup" />
                    <span className="text-sm">Pagar na retirada</span>
                  </label>
                )}
              </RadioGroup>
            )}
          />
        </div>
      )}
    </div>
  );
}
