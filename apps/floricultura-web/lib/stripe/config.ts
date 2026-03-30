import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim();
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim();
}

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurado.');
  stripeInstance = new Stripe(key);
  return stripeInstance;
}
