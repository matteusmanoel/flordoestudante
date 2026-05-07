'use client';

import { useEffect, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FULFILLMENT_TYPE, PAYMENT_METHOD } from '@flordoestudante/core';
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
import { CheckoutRecommendedSection } from './CheckoutRecommendedSection';

function firstNestedErrorMessage(errors: FieldErrors<CheckoutFormValues>): string | null {
  const walk = (v: unknown): string | null => {
    if (v == null || typeof v !== 'object') return null;
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message) return o.message;
    for (const key of Object.keys(o)) {
      if (key === 'ref' || key === 'type') continue;
      const msg = walk(o[key]);
      if (msg) return msg;
    }
    return null;
  };
  return walk(errors);
}

type CheckoutFormProps = {
  activeShippingRule: ShippingRuleOption | null;
  initialGiftMessage?: string;
  initialFulfillment?: 'delivery' | 'pickup';
};

export function CheckoutForm({
  activeShippingRule,
  initialGiftMessage = '',
  initialFulfillment,
}: CheckoutFormProps) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultFulfillment = initialFulfillment
    ? initialFulfillment === 'delivery'
      ? FULFILLMENT_TYPE.DELIVERY
      : FULFILLMENT_TYPE.PICKUP
    : activeShippingRule != null
      ? FULFILLMENT_TYPE.DELIVERY
      : FULFILLMENT_TYPE.PICKUP;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      fulfillment_type: defaultFulfillment,
      address: undefined,
      customer_note: '',
      gift_message: initialGiftMessage,
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

  useEffect(() => {
    if (form.getValues('payment_method') === PAYMENT_METHOD.STRIPE) {
      form.setValue('payment_method', PAYMENT_METHOD.MERCADO_PAGO);
    }
  }, [form]);

  const onInvalid = (errors: FieldErrors<CheckoutFormValues>) => {
    const msg = firstNestedErrorMessage(errors) ?? 'Confira os dados e tente novamente.';
    setSubmitError(msg);
    toast.error(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      toast.error(result.message);
      return;
    }

    clear();
    router.push(`/pedido/${encodeURIComponent(result.publicCode)}`);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {submitError && (
          <div className="mb-5 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* Desktop: grid-cols-[1fr_380px]; Mobile: coluna única */}
        <div className="gap-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Coluna esquerda — formulário */}
          <div className="space-y-5">
            {/* Resumo (mobile only, aparece acima do form) */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:hidden">
              <h2 className="mb-3 font-display text-base font-medium text-foreground">
                Resumo do pedido
              </h2>
              <CheckoutSummary
                hideTitle
                editable
                items={items}
                subtotal={cartPayload.subtotal}
                shippingAmount={shippingAmount}
                total={total}
                fulfillmentType={fulfillmentType}
              />
            </section>

            {/* Contato */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <CheckoutContactSection register={form.register} errors={form.formState.errors} />
            </section>

            {/* Pagamento */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <CheckoutFulfillmentSection
                control={form.control}
                errors={form.formState.errors}
                activeShippingRule={activeShippingRule}
                variant="payment_only"
              />
            </section>

            {/* Entrega */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <CheckoutFulfillmentSection
                control={form.control}
                errors={form.formState.errors}
                activeShippingRule={activeShippingRule}
                variant="delivery_only"
              />
              {fulfillmentType === FULFILLMENT_TYPE.DELIVERY && (
                <div className="mt-5 border-t border-border pt-5">
                  <CheckoutAddressSection
                    register={form.register}
                    errors={form.formState.errors}
                    setValue={form.setValue}
                  />
                </div>
              )}
            </section>

            {/* Observações / mensagem */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <CheckoutNotesSection register={form.register} errors={form.formState.errors} />
            </section>

            {/* CTA mobile */}
            <div className="pt-2 lg:hidden">
              <CheckoutSubmitButton isSubmitting={form.formState.isSubmitting} />
            </div>
          </div>

          {/* Coluna direita — resumo sticky (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 flex flex-col items-center justify-center w-full">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 font-display text-base font-medium text-foreground">
                  Resumo do pedido
                </h2>
                <CheckoutSummary
                  hideTitle
                  editable
                  items={items}
                  subtotal={cartPayload.subtotal}
                  shippingAmount={shippingAmount}
                  total={total}
                  fulfillmentType={fulfillmentType}
                />
              </section>
              <CheckoutSubmitButton isSubmitting={form.formState.isSubmitting} />
            </div>
          </aside>
        </div>
      </form>

      {/* Produtos recomendados — abaixo do form */}
      <div className="mt-8">
        <CheckoutRecommendedSection variant="quickAdd" />
      </div>
    </>
  );
}
