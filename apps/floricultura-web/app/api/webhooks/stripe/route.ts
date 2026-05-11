import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_STATUS } from '@flordoestudante/core';
import type Stripe from 'stripe';

/** Stripe Invoice v20+ — subscription id lives under parent.subscription_details. */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const ref = invoice.parent?.subscription_details?.subscription;
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

export async function POST(req: NextRequest) {
  const webhookSecret = getStripeWebhookSecret();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
      console.warn('[stripe webhook] Sem STRIPE_WEBHOOK_SECRET — evento não verificado');
    }
  } catch (err) {
    console.error('[stripe webhook] Assinatura inválida:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.metadata?.subscription_id;
        const stripeSubId = session.subscription as string | null;
        const stripeCustomerId = session.customer as string | null;

        if (subscriptionId && stripeSubId) {
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: stripeSubId,
              stripe_customer_id: stripeCustomerId,
              status: SUBSCRIPTION_STATUS.ACTIVE,
            })
            .eq('id', subscriptionId);
          console.log('[stripe webhook] Assinatura ativada:', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;
        const status = sub.status;

        const mappedStatus =
          status === 'active' ? SUBSCRIPTION_STATUS.ACTIVE
          : status === 'past_due' ? SUBSCRIPTION_STATUS.ACTIVE
          : status === 'canceled' ? SUBSCRIPTION_STATUS.CANCELLED
          : status === 'paused' ? SUBSCRIPTION_STATUS.PAUSED
          : null;

        if (status === 'past_due') {
          console.warn(
            '[stripe webhook] Subscription past_due — mantendo status ACTIVE (enum não possui past_due):',
            stripeSubId
          );
        }

        if (mappedStatus) {
          const subRecord = sub as unknown as Record<string, number>;
          const periodStart = subRecord.current_period_start;
          const periodEnd = subRecord.current_period_end;
          await supabase
            .from('subscriptions')
            .update({
              status: mappedStatus,
              ...(periodStart ? { current_period_start: new Date(periodStart * 1000).toISOString() } : {}),
              ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
              ...(mappedStatus === SUBSCRIPTION_STATUS.CANCELLED ? { cancelled_at: new Date().toISOString() } : {}),
              ...(mappedStatus === SUBSCRIPTION_STATUS.PAUSED ? { paused_at: new Date().toISOString() } : {}),
            })
            .eq('stripe_subscription_id', stripeSubId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = subscriptionIdFromInvoice(invoice);

        const firstLine = invoice.lines?.data?.[0];
        const periodStart = firstLine?.period?.start ?? null;
        const periodEnd = firstLine?.period?.end ?? null;

        if (stripeSubId) {
          await supabase
            .from('subscriptions')
            .update({
              status: SUBSCRIPTION_STATUS.ACTIVE,
              ...(periodStart ? { current_period_start: new Date(periodStart * 1000).toISOString() } : {}),
              ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
            })
            .eq('stripe_subscription_id', stripeSubId);
          console.log('[stripe webhook] invoice.payment_succeeded:', stripeSubId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = subscriptionIdFromInvoice(invoice);
        if (stripeSubId) {
          // O enum interno não possui "past_due". Mantemos ACTIVE e registramos aviso para acompanhamento.
          console.warn('[stripe webhook] invoice.payment_failed (sem status past_due no enum):', stripeSubId);
          await supabase
            .from('subscriptions')
            .update({ status: SUBSCRIPTION_STATUS.ACTIVE })
            .eq('stripe_subscription_id', stripeSubId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[stripe webhook] Erro ao processar evento:', err);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
