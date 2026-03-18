-- Pedidos, itens, pagamentos e histórico (floricultura)

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  fulfillment_type fulfillment_type NOT NULL,
  shipping_rule_id UUID REFERENCES shipping_rules(id) ON DELETE SET NULL,
  shipping_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method payment_method NOT NULL,
  customer_note TEXT,
  gift_message TEXT,
  admin_note TEXT,
  estimated_fulfillment_text TEXT,
  address_snapshot_json JSONB,
  pricing_snapshot_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(public_code),
  CONSTRAINT orders_total_check CHECK (
    total_amount = subtotal_amount + shipping_amount - discount_amount
  ),
  CONSTRAINT orders_delivery_address CHECK (
    fulfillment_type != 'delivery' OR address_snapshot_json IS NOT NULL
  )
);

CREATE INDEX idx_orders_public_code ON orders(public_code);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Itens do pedido (snapshot para histórico)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_snapshot DECIMAL(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total DECIMAL(12, 2) NOT NULL CHECK (line_total >= 0),
  item_customization_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Pagamentos (Mercado Pago ou manual)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider payment_provider NOT NULL,
  provider_payment_id TEXT,
  provider_preference_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  raw_payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

-- Histórico de status do pedido
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by_type changed_by_type NOT NULL,
  changed_by_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Log de importações (XLSX)
CREATE TABLE imports_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  import_type TEXT NOT NULL,
  status import_status NOT NULL DEFAULT 'pending',
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  error_report_json JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_imports_log_created_at ON imports_log(created_at DESC);
