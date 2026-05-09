import Stripe from 'stripe';
import { getStripe } from './config';
import { getPublicSiteUrl } from '@/lib/site-url';

export interface StripeCheckoutParams {
  planName: string;
  planPrice: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  addons: { name: string; price: number }[];
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  planSlug: string;
  metadata: Record<string, string>;
}

const FREQUENCY_TO_INTERVAL: Record<string, { interval: 'week' | 'month'; interval_count: number }> = {
  weekly: { interval: 'week', interval_count: 1 },
  biweekly: { interval: 'week', interval_count: 2 },
  monthly: { interval: 'month', interval_count: 1 },
};

export async function createSubscriptionCheckout(params: StripeCheckoutParams) {
  const stripe = getStripe();
  const siteUrl = getPublicSiteUrl();
  const intervalConfig = FREQUENCY_TO_INTERVAL[params.frequency] ?? FREQUENCY_TO_INTERVAL.monthly;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'brl',
        product_data: { name: params.planName },
        unit_amount: Math.round(params.planPrice * 100),
        recurring: intervalConfig,
      },
      quantity: 1,
    },
  ];

  for (const addon of params.addons) {
    lineItems.push({
      price_data: {
        currency: 'brl',
        product_data: { name: addon.name },
        unit_amount: Math.round(addon.price * 100),
        recurring: intervalConfig,
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    // Brasil: além de cartão, Stripe Checkout pode oferecer PIX (quando habilitado na conta).
    payment_method_types: ['card', 'pix'],
    line_items: lineItems,
    customer_email: params.customerEmail || undefined,
    metadata: params.metadata,
    subscription_data: {
      metadata: params.metadata,
    },
    success_url: `${siteUrl}/assinaturas/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/assinaturas/${encodeURIComponent(params.planSlug)}`,
  });

  return { sessionId: session.id, url: session.url };
}

export async function createOneTimeCheckout(params: {
  items: { name: string; price: number; quantity: number }[];
  customerEmail?: string;
  metadata: Record<string, string>;
}) {
  const stripe = getStripe();
  const siteUrl = getPublicSiteUrl();

  const lineItems = params.items.map((item) => ({
    price_data: {
      currency: 'brl',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: params.customerEmail || undefined,
    metadata: params.metadata,
    success_url: `${siteUrl}/pedido/{CHECKOUT_SESSION_ID}?status=success`,
    cancel_url: `${siteUrl}/carrinho`,
  });

  return { sessionId: session.id, url: session.url };
}
