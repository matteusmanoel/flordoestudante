-- Enums alinhados a @flordoestudante/core (floricultura)
-- Ordem: criar tipos antes das tabelas que os referenciam

CREATE TYPE order_status AS ENUM (
  'draft',
  'pending_payment',
  'paid',
  'awaiting_approval',
  'approved',
  'in_production',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
  'expired'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'authorized',
  'paid',
  'expired',
  'cancelled',
  'failed',
  'refunded_manual'
);

CREATE TYPE fulfillment_type AS ENUM ('delivery', 'pickup');

CREATE TYPE payment_method AS ENUM (
  'mercado_pago',
  'pay_on_delivery',
  'pay_on_pickup'
);

CREATE TYPE product_kind AS ENUM ('regular', 'customizable');

CREATE TYPE shipping_rule_type AS ENUM ('fixed');

CREATE TYPE admin_role AS ENUM ('owner', 'manager');

CREATE TYPE payment_provider AS ENUM ('mercado_pago', 'manual');

CREATE TYPE import_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TYPE changed_by_type AS ENUM ('system', 'admin');
