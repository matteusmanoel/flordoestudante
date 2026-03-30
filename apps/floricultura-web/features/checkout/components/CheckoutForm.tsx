'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FULFILLMENT_TYPE,
  PAYMENT_METHOD,
} from '@flordoestudante/core';
import { Button } from '@flordoestudante/ui';
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
import { CheckoutStepper } from './CheckoutStepper';

const STEPS = [
  { id: 1, label: 'Contato e entrega' },
  { id: 2, label: 'Pagamento e observações' },
] as const;

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
};

export function CheckoutForm({ activeShippingRule }: CheckoutFormProps) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [step1Busy, setStep1Busy] = useState(false);

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

  useEffect(() => {
    if (form.getValues('payment_method') === PAYMENT_METHOD.STRIPE) {
      form.setValue('payment_method', PAYMENT_METHOD.MERCADO_PAGO);
    }
  }, [form]);

  const onInvalid = (errors: FieldErrors<CheckoutFormValues>) => {
    const msg =
      firstNestedErrorMessage(errors) ?? 'Confira os dados nas etapas anteriores e tente novamente.';
    setSubmitError(msg);
    toast.error(msg);
    setStep(1);
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

    router.push(`/pedido/${encodeURIComponent(result.publicCode)}/pagamento`);
  };

  async function goToStep2() {
    setStep1Busy(true);
    try {
      const baseOk = await form.trigger(['full_name', 'phone', 'email', 'fulfillment_type']);
      if (!baseOk) {
        toast.error('Verifique os dados de contato e a forma de recebimento.');
        return;
      }
      if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY) {
        if (!activeShippingRule) {
          toast.error('Entrega indisponível no momento. Escolha retirada na loja ou tente mais tarde.');
          return;
        }
        const addrOk = await form.trigger('address');
        if (!addrOk) {
          toast.error('Preencha o endereço de entrega para continuar.');
          return;
        }
        form.setValue('shipping_rule_id', activeShippingRule.id);
        const ruleOk = await form.trigger('shipping_rule_id');
        if (!ruleOk) {
          toast.error('Não foi possível validar a taxa de entrega.');
          return;
        }
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setStep1Busy(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="font-serif text-lg font-medium text-foreground">Resumo do pedido</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confira itens e valores antes de preencher seus dados.
        </p>
        <div className="mt-4">
          <CheckoutSummary
            hideTitle
            editable
            items={items}
            subtotal={cartPayload.subtotal}
            shippingAmount={shippingAmount}
            total={total}
            fulfillmentType={fulfillmentType}
          />
        </div>
      </section>

      <CheckoutStepper steps={[...STEPS]} currentStep={step} />

      {step === 1 && (
        <div className="space-y-8 rounded-xl border border-border bg-card/40 p-4 sm:p-6">
          <CheckoutContactSection
            register={form.register}
            errors={form.formState.errors}
          />
          <CheckoutFulfillmentSection
            control={form.control}
            errors={form.formState.errors}
            activeShippingRule={activeShippingRule}
            variant="delivery_only"
          />
          {fulfillmentType === FULFILLMENT_TYPE.DELIVERY && (
            <CheckoutAddressSection
              register={form.register}
              errors={form.formState.errors}
              setValue={form.setValue}
            />
          )}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="lg"
              className="inline-flex items-center justify-center gap-2"
              disabled={step1Busy}
              onClick={() => void goToStep2()}
            >
              {step1Busy ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Validando…
                </>
              ) : (
                'Continuar para pagamento'
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 rounded-xl border border-border bg-card/40 p-4 sm:p-6">
          <CheckoutFulfillmentSection
            control={form.control}
            errors={form.formState.errors}
            activeShippingRule={activeShippingRule}
            variant="payment_only"
          />
          <CheckoutNotesSection
            register={form.register}
            errors={form.formState.errors}
          />
          <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <CheckoutSubmitButton isSubmitting={form.formState.isSubmitting} />
          </div>
        </div>
      )}
    </form>
  );
}
