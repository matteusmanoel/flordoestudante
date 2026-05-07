-- Sprint 1 backfill: tabelas do agente conversacional
-- customers: campos de canal/agente
-- conversations, conversation_messages, agent_events
-- Todas as operações são idempotentes (IF NOT EXISTS / OR REPLACE)

-- ============================================================
-- Extensões de customers
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone_normalized TEXT,
  ADD COLUMN IF NOT EXISTS source_channel TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS external_contact_id TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_phone_normalized
  ON customers(phone_normalized)
  WHERE phone_normalized IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_external_contact_id
  ON customers(external_contact_id)
  WHERE external_contact_id IS NOT NULL;

-- ============================================================
-- Extensões de orders (campos do agente)
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_channel TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS source_conversation_id UUID,
  ADD COLUMN IF NOT EXISTS occasion TEXT,
  ADD COLUMN IF NOT EXISTS desired_fulfillment_date DATE,
  ADD COLUMN IF NOT EXISTS desired_fulfillment_period TEXT,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS surprise_delivery BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_status_note TEXT,
  ADD COLUMN IF NOT EXISTS source_metadata_json JSONB,
  ADD COLUMN IF NOT EXISTS agent_context_json JSONB;

-- ============================================================
-- Enum: estágio da conversa
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_stage') THEN
    CREATE TYPE conversation_stage AS ENUM (
      'new',
      'identificando_necessidade',
      'coletando_ocasiao',
      'coletando_preferencia',
      'coletando_orcamento',
      'consultando_catalogo',
      'apresentando_opcoes',
      'pedido_em_montagem',
      'coletando_entrega_ou_retirada',
      'coletando_destinatario',
      'coletando_mensagem_cartao',
      'aguardando_confirmacao_humana',
      'handoff',
      'human_takeover',
      'finalizado'
    );
  END IF;
END
$$;

-- ============================================================
-- Tabela: conversations
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone_normalized TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  remote_jid TEXT,
  instance TEXT,
  stage conversation_stage NOT NULL DEFAULT 'new',
  human_takeover BOOLEAN NOT NULL DEFAULT false,
  current_order_id UUID,
  last_message_at TIMESTAMPTZ,
  last_agent_action TEXT,
  context_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_phone_normalized
  ON conversations(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id
  ON conversations(customer_id)
  WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_stage
  ON conversations(stage);
CREATE INDEX IF NOT EXISTS idx_conversations_human_takeover
  ON conversations(human_takeover);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations(last_message_at DESC NULLS LAST);

-- FK reversa orders → conversations (adicionada após ambas existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_orders_source_conversation'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_source_conversation
      FOREIGN KEY (source_conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- FK reversa conversations → orders (current_order_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_conversations_current_order'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT fk_conversations_current_order
      FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- ============================================================
-- Tabela: conversation_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_id TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  message_text TEXT,
  message_text_normalized TEXT,
  raw_payload_json JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_messages_message_id
  ON conversation_messages(message_id)
  WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation_id
  ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_sent_at
  ON conversation_messages(sent_at DESC);

-- ============================================================
-- Tabela: agent_events
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  action TEXT,
  stage_before TEXT,
  stage_after TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_conversation_id
  ON agent_events(conversation_id)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_events_event_type
  ON agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at
  ON agent_events(created_at DESC);

-- ============================================================
-- Trigger updated_at para conversations
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'conversations_updated_at'
  ) THEN
    CREATE TRIGGER conversations_updated_at
      BEFORE UPDATE ON conversations
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
  END IF;
END
$$;

-- ============================================================
-- RLS (service_role bypass via RPC SECURITY DEFINER)
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_admin_all" ON conversations;
CREATE POLICY "conversations_admin_all"
  ON conversations FOR ALL
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "conversation_messages_admin_all" ON conversation_messages;
CREATE POLICY "conversation_messages_admin_all"
  ON conversation_messages FOR ALL
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "agent_events_admin_all" ON agent_events;
CREATE POLICY "agent_events_admin_all"
  ON agent_events FOR ALL
  USING (public.current_user_is_admin());
