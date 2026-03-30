'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import { SUBSCRIPTION_FREQUENCY_LABELS } from '@flordoestudante/core';
import type { SubscriptionFrequency } from '@flordoestudante/core';
import { processSubscriptionCheckout } from '@/features/subscriptions/checkout-action';

type Props = {
  plan: { id: string; name: string; slug: string; price: number; frequency: SubscriptionFrequency };
  addons: { id: string; name: string; price: number }[];
};

export function SubscriptionCheckoutClient({ plan, addons }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
  const total = plan.price + addonsTotal;
  const freqLabel = SUBSCRIPTION_FREQUENCY_LABELS[plan.frequency];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await processSubscriptionCheckout({
      planId: plan.id,
      addonIds: addons.map((a) => a.id),
      fullName: fd.get('full_name') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      address: {
        recipient_name: fd.get('recipient_name') as string,
        phone: fd.get('address_phone') as string,
        street: fd.get('street') as string,
        number: fd.get('number') as string,
        complement: (fd.get('complement') as string) || undefined,
        neighborhood: fd.get('neighborhood') as string,
        city: fd.get('city') as string,
        state: fd.get('state') as string,
        postal_code: fd.get('postal_code') as string,
      },
      customerNote: fd.get('customer_note') as string,
    });

    if (result.success && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setError(result.message ?? 'Erro ao processar.');
    setLoading(false);
  }

  return (
    <div className="container max-w-2xl px-4 py-8 md:py-14">
      <h1 className="font-serif text-2xl font-medium mb-2">Finalizar Assinatura</h1>
      <p className="text-muted-foreground mb-8">
        {plan.name} — {formatCurrency(plan.price)}/{freqLabel.toLowerCase()}
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="font-medium text-lg mb-2">Seus dados</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="opcional" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-medium text-lg mb-2">Endereço de entrega</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="recipient_name">Nome do destinatário</Label>
              <Input id="recipient_name" name="recipient_name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address_phone">Telefone do destinatário</Label>
              <Input id="address_phone" name="address_phone" type="tel" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input id="street" name="street" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="number">Número</Label>
              <Input id="number" name="number" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" name="complement" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" name="neighborhood" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">UF</Label>
              <Input id="state" name="state" maxLength={2} required placeholder="RS" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="postal_code">CEP</Label>
              <Input id="postal_code" name="postal_code" required placeholder="00000-000" />
            </div>
          </div>
        </fieldset>

        <div className="space-y-1">
          <Label htmlFor="customer_note">Observações (opcional)</Label>
          <Input id="customer_note" name="customer_note" placeholder="Preferências de flores, horário..." />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
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

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Redirecionando para pagamento...' : `Pagar ${formatCurrency(total)} via Stripe`}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Você será redirecionado para o Stripe para concluir o pagamento de forma segura.
        </p>
      </form>
    </div>
  );
}
