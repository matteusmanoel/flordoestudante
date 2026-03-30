-- Assinaturas, complementos e extensão do provider para Stripe

-- Novos enums
CREATE TYPE subscription_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Estender enums existentes
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'stripe';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'stripe';

-- Planos de assinatura
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  cover_image_url TEXT,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  frequency subscription_frequency NOT NULL DEFAULT 'monthly',
  delivery_day_of_week INT CHECK (delivery_day_of_week IS NULL OR (delivery_day_of_week >= 0 AND delivery_day_of_week <= 6)),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active, sort_order);

-- Assinaturas do cliente
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  address_snapshot_json JSONB,
  customer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Complementos (add-ons)
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  cover_image_url TEXT,
  addon_category TEXT NOT NULL DEFAULT 'gift',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

CREATE INDEX idx_addons_slug ON addons(slug);
CREATE INDEX idx_addons_active ON addons(is_active, sort_order);

-- Relação produtos <-> complementos
CREATE TABLE product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(product_id, addon_id)
);

CREATE INDEX idx_product_addons_product ON product_addons(product_id);

-- Relação planos <-> complementos
CREATE TABLE plan_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(plan_id, addon_id)
);

CREATE INDEX idx_plan_addons_plan ON plan_addons(plan_id);

-- Triggers updated_at
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER addons_updated_at
  BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_addons ENABLE ROW LEVEL SECURITY;

-- Leitura pública dos planos ativos e addons ativos
CREATE POLICY "subscription_plans_select_public" ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "addons_select_public" ON addons FOR SELECT USING (is_active = true);
CREATE POLICY "product_addons_select_public" ON product_addons FOR SELECT USING (true);
CREATE POLICY "plan_addons_select_public" ON plan_addons FOR SELECT USING (true);
