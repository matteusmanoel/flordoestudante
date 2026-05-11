'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
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
import { CheckoutPickupRecipientSection } from './CheckoutPickupRecipientSection';
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
      pickup_recipient_name: '',
      pickup_phone: '',
    },
  });

  const cartPayload = cartToCheckoutPayload(items);
  const fulfillmentType = form.watch('fulfillment_type');
  const shippingAmount =
    fulfillmentType === FULFILLMENT_TYPE.DELIVERY && activeShippingRule
      ? activeShippingRule.amount
      : 0;
  const total = cartPayload.subtotal + shippingAmount;

  const [contactSectionHeight, setContactSectionHeight] = useState(0);
  const [viewportSummaryCapPx, setViewportSummaryCapPx] = useState(480);

  useLayoutEffect(() => {
    const el = document.getElementById('checkout-contact-section');
    if (!el) return;

    const measure = () => {
      setContactSectionHeight(el.getBoundingClientRect().height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateViewportCap = () => {
      // top-24 (6rem) + espaço para CTA + gaps (~5rem)
      setViewportSummaryCapPx(Math.max(200, window.innerHeight - 6 * 16 - 5 * 16));
    };
    updateViewportCap();
    window.addEventListener('resize', updateViewportCap);
    return () => window.removeEventListener('resize', updateViewportCap);
  }, []);

  /** Área rolável do resumo (itens + totais): até o teto da viewport ou da altura do bloco Contato — o que for menor. */
  const checkoutSummaryScrollMaxPx =
    contactSectionHeight > 0
      ? Math.min(viewportSummaryCapPx, contactSectionHeight)
      : viewportSummaryCapPx;

  useEffect(() => {
    if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY && activeShippingRule != null) {
      form.setValue('shipping_rule_id', activeShippingRule.id);
    } else {
      form.setValue('shipping_rule_id', null);
    }

    if (fulfillmentType === FULFILLMENT_TYPE.PICKUP) {
      // Evita que um `address` parcial (de quando estava em "Entrega") continue bloqueando validação.
      form.setValue('address', undefined, { shouldDirty: false, shouldTouch: false });
      form.clearErrors('address');
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

    const pickupRecipient = data.pickup_recipient_name?.trim();
    const pickupPhone = data.pickup_phone?.trim();
    const pickupNote =
      data.fulfillment_type === FULFILLMENT_TYPE.PICKUP && pickupRecipient && pickupPhone
        ? `Retirada por ${pickupRecipient} (${pickupPhone})`
        : null;
    const customerNote = [data.customer_note?.trim(), pickupNote].filter(Boolean).join(' | ') || '';

    const result = await finalizeCheckout({
      form: {
        ...data,
        customer_note: customerNote,
      },
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

        {/* Desktop/tablet: grid só no bloco formulário + resumo; “Complete seu presente” fica abaixo em largura total — o sticky do resumo para ao fim da coluna do form. */}
        <div className="gap-8 md:grid md:grid-cols-[1fr_380px] md:items-stretch">
          {/* Coluna esquerda — formulário */}
          <div className="space-y-5 md:col-start-1 md:row-start-1">
            {/* Resumo (mobile): sticky abaixo do header ao rolar o formulário */}
            <section className="sticky top-14 z-20 rounded-xl border border-border bg-card p-4 shadow-sm md:static md:z-auto md:hidden">
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

            {/* Contato — referência visual para altura máxima do resumo (sticky) */}
            <section
              id="checkout-contact-section"
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
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
              {fulfillmentType === FULFILLMENT_TYPE.PICKUP && (
                <div className="mt-5 border-t border-border pt-5">
                  <CheckoutPickupRecipientSection
                    register={form.register}
                    errors={form.formState.errors}
                  />
                </div>
              )}
            </section>

            {/* Observações / mensagem */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <CheckoutNotesSection register={form.register} errors={form.formState.errors} />
            </section>

            {/* CTA mobile */}
            <div className="pt-2 md:hidden">
              <CheckoutSubmitButton isSubmitting={form.formState.isSubmitting} />
            </div>
          </div>

          {/* Coluna direita — altura = só o formulário: sticky acompanha o scroll até o fim desta coluna (início de “Complete seu presente”). */}
          <aside className="hidden min-h-0 md:col-start-2 md:row-start-1 md:block md:self-stretch">
            <div className="sticky top-24 z-30 flex w-full max-h-[min(100dvh,calc(100vh-6rem))] flex-col gap-4">
              <div className="flex min-h-0 w-full flex-col gap-4 overflow-hidden">
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h2 className="mb-3 shrink-0 font-display text-base font-medium text-foreground">
                    Resumo do pedido
                  </h2>
                  <CheckoutSummary
                    hideTitle
                    editable
                    pinnedTotalsLayout
                    listMaxHeightPx={checkoutSummaryScrollMaxPx}
                    items={items}
                    subtotal={cartPayload.subtotal}
                    shippingAmount={shippingAmount}
                    total={total}
                    fulfillmentType={fulfillmentType}
                  />
                </section>
                <CheckoutSubmitButton isSubmitting={form.formState.isSubmitting} />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 w-full min-w-0">
          <CheckoutRecommendedSection variant="quickAdd" />
        </div>
      </form>
    </>
  );
}
