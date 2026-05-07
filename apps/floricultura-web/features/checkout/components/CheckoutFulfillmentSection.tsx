'use client';

import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Store, RadioTower } from 'lucide-react';
import { RadioGroup, RadioGroupItem, Label } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
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

type PaymentOption = {
  value: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
};

export function CheckoutFulfillmentSection({
  control,
  errors,
  activeShippingRule,
  variant = 'full',
}: Props) {
  const fulfillmentType = useWatch({ control, name: 'fulfillment_type' });
  const paymentMethod = useWatch({ control, name: 'payment_method' });

  const showDelivery = variant === 'full' || variant === 'delivery_only';
  const showPayment = variant === 'full' || variant === 'payment_only';

  const paymentOptions: PaymentOption[] = [
    {
      value: PAYMENT_METHOD.MERCADO_PAGO,
      label: 'PIX / Cartão',
      detail: 'Via Mercado Pago',
      icon: <CreditCard className="h-5 w-5" />,
    },
    ...(fulfillmentType === FULFILLMENT_TYPE.DELIVERY
      ? [
          {
            value: PAYMENT_METHOD.PAY_ON_DELIVERY,
            label: 'Pagar na entrega',
            detail: 'Dinheiro ou cartão',
            icon: <Truck className="h-5 w-5" />,
          },
        ]
      : []),
    ...(fulfillmentType === FULFILLMENT_TYPE.PICKUP
      ? [
          {
            value: PAYMENT_METHOD.PAY_ON_PICKUP,
            label: 'Pagar na retirada',
            detail: 'Na loja',
            icon: <Store className="h-5 w-5" />,
          },
        ]
      : []),
  ];

  const selectedPaymentIndex = paymentOptions.findIndex((o) => o.value === paymentMethod);
  const colWidth = `calc(${100 / paymentOptions.length}% - ${((paymentOptions.length - 1) * 4) / paymentOptions.length}px)`;

  return (
    <div className="space-y-4">
      {showDelivery && (
        <div className="space-y-3">
          <h3 className="font-display text-base font-medium text-foreground">
            Entrega ou retirada
          </h3>
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
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5',
                    !activeShippingRule ? 'pointer-events-none opacity-50' : 'border-border'
                  )}
                >
                  <RadioGroupItem
                    value={FULFILLMENT_TYPE.DELIVERY}
                    id="fulfillment-delivery"
                    disabled={!activeShippingRule}
                  />
                  <div>
                    <span className="block text-sm font-medium">Entrega</span>
                    {activeShippingRule ? (
                      <span className="text-xs text-muted-foreground">
                        + {activeShippingRule.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Indisponível</span>
                    )}
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                  <RadioGroupItem value={FULFILLMENT_TYPE.PICKUP} id="fulfillment-pickup" />
                  <div>
                    <span className="block text-sm font-medium">Retirada</span>
                    <span className="text-xs text-muted-foreground">Sem taxa</span>
                  </div>
                </label>
              </RadioGroup>
            )}
          />
          {errors.fulfillment_type && (
            <p className="text-sm text-destructive">{errors.fulfillment_type.message}</p>
          )}
        </div>
      )}

      {showPayment && (
        <div className="space-y-3">
          <h3 className="font-display text-base font-medium text-foreground">Forma de pagamento</h3>
          <Controller
            name="payment_method"
            control={control}
            render={({ field }) => (
              <div className="relative flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
                {/* Indicador deslizante */}
                {selectedPaymentIndex >= 0 && (
                  <motion.div
                    layoutId="payment-tab-indicator"
                    className="absolute inset-y-1 rounded-lg bg-green-50 border border-green-200"
                    style={{
                      width: colWidth,
                      left: `calc(${selectedPaymentIndex} * (${colWidth} + 4px) + 4px)`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      'relative z-10 flex flex-1 flex-col items-center gap-1 rounded-lg px-3 py-3 text-xs font-medium transition-colors',
                      field.value === opt.value
                        ? 'text-green-700'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {opt.icon}
                    <span className="leading-tight text-center">{opt.label}</span>
                    <span className="hidden text-[10px] font-normal opacity-70 sm:block">
                      {opt.detail}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.payment_method && (
            <p className="text-sm text-destructive">{errors.payment_method.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
