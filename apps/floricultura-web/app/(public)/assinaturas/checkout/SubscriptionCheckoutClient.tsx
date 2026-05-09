'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Input, Label, Textarea } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import { SUBSCRIPTION_FREQUENCY_LABELS } from '@flordoestudante/core';
import type { SubscriptionFrequency } from '@flordoestudante/core';
import { processSubscriptionCheckout } from '@/features/subscriptions/checkout-action';
import { fetchAddressByCep } from '@/lib/viacep';
import { z } from 'zod';

type Props = {
  plan: { id: string; name: string; slug: string; price: number; frequency: SubscriptionFrequency };
  addons: { id: string; name: string; price: number }[];
};

const subscriptionCheckoutFormSchema = z.object({
  full_name: z.string().trim().min(2, 'Informe seu nome completo.'),
  phone: z.string().trim().min(8, 'Informe um telefone válido.'),
  email: z.string().trim().email('Informe um e-mail válido.').or(z.literal('')).default(''),
  address: z.object({
    recipient_name: z.string().trim().min(2, 'Informe o nome do destinatário.'),
    phone: z.string().trim().min(8, 'Informe um telefone válido.'),
    postal_code: z
      .string()
      .trim()
      .refine((v) => /^\d{5}-?\d{3}$/.test(v), 'Informe um CEP válido.'),
    number: z.string().trim().min(1, 'Informe o número.'),
    street: z.string().trim().min(2, 'Informe a rua.'),
    neighborhood: z.string().trim().min(2, 'Informe o bairro.'),
    city: z.string().trim().min(2, 'Informe a cidade.'),
    state: z
      .string()
      .trim()
      .min(2, 'Informe a UF.')
      .max(2, 'Informe a UF.')
      .transform((v) => v.toUpperCase()),
    complement: z.string().trim().optional().or(z.literal('')).default(''),
  }),
  gift_message: z.string().trim().max(500, 'Mensagem muito longa.').optional().or(z.literal('')).default(''),
  customer_note: z.string().trim().max(500, 'Observação muito longa.').optional().or(z.literal('')).default(''),
});

type SubscriptionCheckoutFormValues = z.infer<typeof subscriptionCheckoutFormSchema>;

function firstNestedErrorMessage(errors: FieldErrors<SubscriptionCheckoutFormValues>): string | null {
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

export function SubscriptionCheckoutClient({ plan, addons }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [expandedAddress, setExpandedAddress] = useState(false);

  const addonsTotal = useMemo(() => addons.reduce((sum, a) => sum + a.price, 0), [addons]);
  const total = useMemo(() => plan.price + addonsTotal, [plan.price, addonsTotal]);
  const freqLabel = SUBSCRIPTION_FREQUENCY_LABELS[plan.frequency];

  const form = useForm<SubscriptionCheckoutFormValues>({
    resolver: zodResolver(subscriptionCheckoutFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      address: {
        recipient_name: '',
        phone: '',
        postal_code: '',
        number: '',
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: '',
      },
      gift_message: '',
      customer_note: '',
    },
  });

  useEffect(() => {
    // garantir expanded quando já temos CEP digitado
    const cep = form.getValues('address.postal_code')?.replace(/\D/g, '');
    if (cep?.length === 8) setExpandedAddress(true);
  }, [form]);

  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value?.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setExpandedAddress(true);
    setLoadingCep(true);
    try {
      const data = await fetchAddressByCep(cep);
      if (data) {
        form.setValue('address.street', data.logradouro ?? '', { shouldValidate: true });
        form.setValue('address.neighborhood', data.bairro ?? '', { shouldValidate: true });
        form.setValue('address.city', data.localidade ?? '', { shouldValidate: true });
        form.setValue('address.state', (data.uf ?? '').toUpperCase(), { shouldValidate: true });
        toast.success('Endereço preenchido automaticamente.');
      }
    } catch {
      toast.error('Não foi possível buscar o CEP.');
    } finally {
      setLoadingCep(false);
    }
  }

  const onInvalid = (errors: FieldErrors<SubscriptionCheckoutFormValues>) => {
    const msg = firstNestedErrorMessage(errors) ?? 'Confira os dados e tente novamente.';
    setSubmitError(msg);
    toast.error(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (values: SubscriptionCheckoutFormValues) => {
    setSubmitError(null);

    const result = await processSubscriptionCheckout({
      planId: plan.id,
      addonIds: addons.map((a) => a.id),
      fullName: values.full_name,
      phone: values.phone,
      email: values.email,
      address: {
        recipient_name: values.address.recipient_name,
        phone: values.address.phone,
        street: values.address.street,
        number: values.address.number,
        complement: values.address.complement || undefined,
        neighborhood: values.address.neighborhood,
        city: values.address.city,
        state: values.address.state,
        postal_code: values.address.postal_code,
      },
      giftMessage: values.gift_message,
      customerNote: values.customer_note,
    });

    if (result.success && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    const msg = result.message ?? 'Erro ao processar.';
    setSubmitError(msg);
    toast.error(msg);
  };

  return (
    <div className="container px-4 py-8 md:py-14">
      <h1 className="font-serif text-2xl font-medium mb-2">Finalizar assinatura</h1>
      <p className="text-muted-foreground mb-8">
        {plan.name} — {formatCurrency(plan.price)}/{freqLabel.toLowerCase()}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {submitError && (
          <div className="mb-5 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="gap-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-5">
            {/* Resumo (mobile) */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:hidden">
              <h2 className="mb-3 font-display text-base font-medium text-foreground">
                Resumo da assinatura
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plano ({freqLabel.toLowerCase()})</span>
                  <span>{formatCurrency(plan.price)}</span>
                </div>
                {addons.map((a) => (
                  <div key={a.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{a.name}</span>
                    <span>+ {formatCurrency(a.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border/60 pt-2 font-medium">
                  <span>Total por ciclo</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-medium text-foreground">Contato</h3>
                <div className="grid gap-4 sm:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo *</Label>
                    <Input
                      id="full_name"
                      placeholder="Seu nome"
                      {...form.register('full_name')}
                      className={form.formState.errors.full_name ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.full_name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      {...form.register('phone')}
                      className={form.formState.errors.phone ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...form.register('email')}
                      className={form.formState.errors.email ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recomendado para receber atualizações da assinatura e do pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Endereço */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-display text-base font-medium text-foreground">Endereço de entrega</h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="address.recipient_name">Nome do destinatário *</Label>
                    <Input
                      id="address.recipient_name"
                      placeholder="Nome de quem recebe"
                      {...form.register('address.recipient_name')}
                      className={form.formState.errors.address?.recipient_name ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.address?.recipient_name && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.address.recipient_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address.phone">Telefone do destinatário *</Label>
                    <Input
                      id="address.phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      {...form.register('address.phone')}
                      className={form.formState.errors.address?.phone ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.address?.phone && (
                      <p className="text-xs text-destructive">{form.formState.errors.address.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.postal_code">CEP *</Label>
                    <Input
                      id="address.postal_code"
                      placeholder="00000-000"
                      {...form.register('address.postal_code')}
                      onBlur={handleCepBlur}
                      className={form.formState.errors.address?.postal_code ? 'border-destructive' : ''}
                      disabled={loadingCep}
                    />
                    {loadingCep && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
                    {form.formState.errors.address?.postal_code && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.address.postal_code.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.number">Número *</Label>
                    <Input
                      id="address.number"
                      placeholder="Nº"
                      {...form.register('address.number')}
                      className={form.formState.errors.address?.number ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.address?.number && (
                      <p className="text-xs text-destructive">{form.formState.errors.address.number.message}</p>
                    )}
                  </div>
                </div>

                {!expandedAddress && (
                  <button
                    type="button"
                    onClick={() => setExpandedAddress(true)}
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Preencher endereço manualmente
                  </button>
                )}

                <div
                  className={[
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    expandedAddress ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0',
                  ].join(' ')}
                >
                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-1" style={{ gridColumn: '1' }}>
                      <Label htmlFor="address.street">Rua *</Label>
                      <Input
                        id="address.street"
                        placeholder="Rua, avenida"
                        {...form.register('address.street')}
                        className={form.formState.errors.address?.street ? 'border-destructive' : ''}
                      />
                      {form.formState.errors.address?.street && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.address.street.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address.state">UF *</Label>
                      <Input
                        id="address.state"
                        placeholder="SP"
                        maxLength={2}
                        {...form.register('address.state')}
                        className={form.formState.errors.address?.state ? 'border-destructive' : ''}
                      />
                      {form.formState.errors.address?.state && (
                        <p className="text-xs text-destructive">{form.formState.errors.address.state.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="address.neighborhood">Bairro *</Label>
                      <Input
                        id="address.neighborhood"
                        placeholder="Bairro"
                        {...form.register('address.neighborhood')}
                        className={form.formState.errors.address?.neighborhood ? 'border-destructive' : ''}
                      />
                      {form.formState.errors.address?.neighborhood && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.address.neighborhood.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address.city">Cidade *</Label>
                      <Input
                        id="address.city"
                        placeholder="Cidade"
                        {...form.register('address.city')}
                        className={form.formState.errors.address?.city ? 'border-destructive' : ''}
                      />
                      {form.formState.errors.address?.city && (
                        <p className="text-xs text-destructive">{form.formState.errors.address.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="address.complement">Complemento</Label>
                      <Input
                        id="address.complement"
                        placeholder="Apto, bloco"
                        {...form.register('address.complement')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Mensagem / observações */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="space-y-5">
                <h3 className="font-display text-lg font-medium text-foreground">Detalhes</h3>

                <div className="rounded-xl border border-accent/60 bg-accent/15 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Label htmlFor="gift_message" className="text-sm font-medium text-foreground">
                      Mensagem para o cartão
                    </Label>
                    <span className="text-xs text-muted-foreground">(opcional)</span>
                  </div>
                  <Textarea
                    id="gift_message"
                    placeholder="Ex: Feliz aniversário! Com muito carinho e amor..."
                    rows={3}
                    {...form.register('gift_message')}
                    className={`bg-background ${form.formState.errors.gift_message ? 'border-destructive' : 'border-border/60'}`}
                  />
                  {form.formState.errors.gift_message && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.gift_message.message}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    A mensagem será incluída em um cartão junto com a entrega.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_note" className="text-sm font-medium">
                    Observações gerais <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    id="customer_note"
                    placeholder="Preferências de flores, horário, instruções de entrega..."
                    rows={2}
                    {...form.register('customer_note')}
                    className={form.formState.errors.customer_note ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.customer_note && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.customer_note.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* CTA mobile */}
            <div className="pt-2 lg:hidden">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Redirecionando para pagamento...'
                  : `Pagar ${formatCurrency(total)} no Stripe`}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Você será redirecionado para concluir o pagamento de forma segura (cartão ou PIX, se disponível).
              </p>
            </div>
          </div>

          {/* Coluna direita — resumo sticky (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 flex flex-col items-center justify-center w-full">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm w-full">
                <h2 className="mb-3 font-display text-base font-medium text-foreground">
                  Resumo da assinatura
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plano ({freqLabel.toLowerCase()})</span>
                    <span>{formatCurrency(plan.price)}</span>
                  </div>
                  {addons.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{a.name}</span>
                      <span>+ {formatCurrency(a.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border/60 pt-2 font-medium">
                    <span>Total por ciclo</span>
                    <span className="text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
              </section>

              <Button
                type="submit"
                size="lg"
                className="w-full sm:min-w-[240px]"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Redirecionando...'
                  : `Pagar ${formatCurrency(total)} no Stripe`}
              </Button>
              <p className="text-center text-xs text-muted-foreground max-w-[320px]">
                Você será redirecionado para o Stripe para concluir o pagamento de forma segura.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
