'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  FULFILLMENT_TYPE,
  PAYMENT_METHOD,
} from '@flordoestudante/core';
import { checkoutFormSchema, type CheckoutFormValues } from '../schema';
import type { ShippingRuleOption } from '../types';
import { finalizeCheckout } from '../actions';
import { cartToCheckoutPayload } from '@/features/cart';
import { useCart } from '@/features/cart/store';
import { CheckoutContactSection } from './CheckoutContactSection';
import { CheckoutFulfillmentSection } from './CheckoutFulfillmentSection';
import { CheckoutAddressSection } from './CheckoutAddressSection';
import { CheckoutNotesSection } from './CheckoutNotesSection';
import { CheckoutSummary } from './CheckoutSummary';
import { CheckoutSubmitButton } from './CheckoutSubmitButton';

type CheckoutFormProps = {
  activeShippingRule: ShippingRuleOption | null;
};

export function CheckoutForm({ activeShippingRule }: CheckoutFormProps) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      fulfillment_type:
        activeShippingRule != null ? FULFILLMENT_TYPE.DELIVERY : FULFILLMENT_TYPE.PICKUP,
      address: undefined,
      customer_note: '',
      gift_message: '',
      payment_method: PAYMENT_METHOD.MERCADO_PAGO,
      shipping_rule_id: activeShippingRule?.id ?? null,
    },
  });

  const cartPayload = cartToCheckoutPayload(items);
  const fulfillmentType = form.watch('fulfillment_type');
  const shippingAmount =
    fulfillmentType === FULFILLMENT_TYPE.DELIVERY && activeShippingRule
      ? activeShippingRule.amount
      : 0;
  const total = cartPayload.subtotal + shippingAmount;

  useEffect(() => {
    if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY && activeShippingRule != null) {
      form.setValue('shipping_rule_id', activeShippingRule.id);
    } else {
      form.setValue('shipping_rule_id', null);
    }
  }, [fulfillmentType, activeShippingRule, form]);

  useEffect(() => {
    const pm = form.getValues('payment_method');
    if (fulfillmentType === FULFILLMENT_TYPE.PICKUP && pm === PAYMENT_METHOD.PAY_ON_DELIVERY) {
      form.setValue('payment_method', PAYMENT_METHOD.MERCADO_PAGO);
    }
    if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY && pm === PAYMENT_METHOD.PAY_ON_PICKUP) {
      form.setValue('payment_method', PAYMENT_METHOD.MERCADO_PAGO);
    }
  }, [fulfillmentType, form]);

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitError(null);
    const shippingRuleId =
      data.fulfillment_type === FULFILLMENT_TYPE.DELIVERY && activeShippingRule
        ? activeShippingRule.id
        : null;
    const shipping =
      data.fulfillment_type === FULFILLMENT_TYPE.DELIVERY && activeShippingRule
        ? activeShippingRule.amount
        : 0;

    const result = await finalizeCheckout({
      form: data,
      cart: cartPayload,
      shippingAmount: shipping,
      shippingRuleId,
    });

    if (!result.success) {
      setSubmitError(result.message);
      return;
    }

    clear();
    router.push(`/pedido/${encodeURIComponent(result.publicCode)}/pagamento`);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <CheckoutContactSection
            register={form.register}
            errors={form.formState.errors}
          />
          <CheckoutFulfillmentSection
            control={form.control}
            errors={form.formState.errors}
            activeShippingRule={activeShippingRule}
          />
          {fulfillmentType === FULFILLMENT_TYPE.DELIVERY && (
            <CheckoutAddressSection
              register={form.register}
              errors={form.formState.errors}
            />
          )}
          <CheckoutNotesSection
            register={form.register}
            errors={form.formState.errors}
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CheckoutSummary
            items={items}
            subtotal={cartPayload.subtotal}
            shippingAmount={shippingAmount}
            total={total}
            fulfillmentType={fulfillmentType}
          />
          <div className="mt-6 flex justify-end">
            <CheckoutSubmitButton isSubmitting={form.formState.isSubmitting} />
          </div>
        </div>
      </div>
    </form>
  );
}
