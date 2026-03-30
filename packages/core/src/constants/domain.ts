/**
 * Constantes de domínio compartilhadas.
 */

export const PRODUCT_KIND = {
  REGULAR: 'regular',
  CUSTOMIZABLE: 'customizable',
} as const;

export type ProductKind = (typeof PRODUCT_KIND)[keyof typeof PRODUCT_KIND];

export const FULFILLMENT_TYPE = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
} as const;

export type FulfillmentType = (typeof FULFILLMENT_TYPE)[keyof typeof FULFILLMENT_TYPE];

export const PAYMENT_METHOD = {
  MERCADO_PAGO: 'mercado_pago',
  PAY_ON_DELIVERY: 'pay_on_delivery',
  PAY_ON_PICKUP: 'pay_on_pickup',
  STRIPE: 'stripe',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const SHIPPING_RULE_TYPE = {
  FIXED: 'fixed',
} as const;

export type ShippingRuleType = (typeof SHIPPING_RULE_TYPE)[keyof typeof SHIPPING_RULE_TYPE];

export const ADMIN_ROLE = {
  OWNER: 'owner',
  MANAGER: 'manager',
} as const;

export type AdminRole = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];

export const PAYMENT_PROVIDER = {
  MERCADO_PAGO: 'mercado_pago',
  MANUAL: 'manual',
  STRIPE: 'stripe',
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];

export const SUBSCRIPTION_FREQUENCY = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const;

export type SubscriptionFrequency = (typeof SUBSCRIPTION_FREQUENCY)[keyof typeof SUBSCRIPTION_FREQUENCY];

export const SUBSCRIPTION_FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  [SUBSCRIPTION_FREQUENCY.WEEKLY]: 'Semanal',
  [SUBSCRIPTION_FREQUENCY.BIWEEKLY]: 'Quinzenal',
  [SUBSCRIPTION_FREQUENCY.MONTHLY]: 'Mensal',
};

export const SUBSCRIPTION_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SUBSCRIPTION_STATUS.PENDING_PAYMENT]: 'Aguardando Pagamento',
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Ativa',
  [SUBSCRIPTION_STATUS.PAUSED]: 'Pausada',
  [SUBSCRIPTION_STATUS.CANCELLED]: 'Cancelada',
  [SUBSCRIPTION_STATUS.EXPIRED]: 'Expirada',
};

export const IMPORT_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ImportStatus = (typeof IMPORT_STATUS)[keyof typeof IMPORT_STATUS];
