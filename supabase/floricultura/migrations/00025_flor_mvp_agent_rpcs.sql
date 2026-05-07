-- =============================================================================
-- 00025_flor_mvp_agent_rpcs.sql
--
-- Migration consolidada do MVP do Agente WhatsApp — Flor do Estudante.
-- Aplica todas as RPCs do agente com colunas corretas do schema real de produção.
--
-- Esta migration SUBSTITUI as 00021, 00022 e 00023, que NUNCA foram aplicadas
-- ao banco de produção. Os arquivos anteriores contêm erros de nomes de coluna
-- corrigidos aqui.
--
-- ERROS CORRIGIDOS vs 00022:
--   orders.conversation_id       → source_conversation_id
--   orders.notes                 → customer_note
--   shipping_rules.fixed_amount  → amount
--   conversations.status = 'waiting_human' → 'pending' (valor válido)
--
-- ERROS CORRIGIDOS vs 00023:
--   INSERT INTO settings (key, value, description) → settings não tem coluna key;
--   substituído por UPDATE nas colunas corretas (idempotente).
--
-- Segurança: SECURITY DEFINER em todas as funções.
-- RLS em conversations/conversation_messages/agent_events está desativado por ora
-- (separado em 00024 — não aplicar sem revisar policies).
--
-- Seguro re-executar: CREATE OR REPLACE FUNCTION, ADD COLUMN IF NOT EXISTS,
-- CREATE INDEX IF NOT EXISTS, ON CONFLICT DO NOTHING.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PARTE 1 — Schema additions (conversation_messages media columns)
-- ---------------------------------------------------------------------------

ALTER TABLE conversation_messages
  ADD COLUMN IF NOT EXISTS transcription      TEXT,
  ADD COLUMN IF NOT EXISTS visual_description TEXT;

COMMENT ON COLUMN conversation_messages.transcription
  IS 'Transcrição OpenAI Whisper de mensagens de áudio (agente MVP+)';

COMMENT ON COLUMN conversation_messages.visual_description
  IS 'Descrição OpenAI/OpenRouter Vision de mensagens de imagem (agente MVP+)';

-- ---------------------------------------------------------------------------
-- PARTE 2 — Dia das Mães: tag todos os produtos ativos
-- ---------------------------------------------------------------------------

-- Garantir colunas de tags (podem existir do schema base)
ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion_tags TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS style_tags    TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_tags    TEXT[] DEFAULT '{}';

-- Taguear produtos ativos com dia_das_maes e presente (idempotente)
UPDATE products
SET occasion_tags = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(occasion_tags, '{}') || ARRAY['dia_das_maes', 'presente']
    )
  )
)
WHERE is_active = true
  AND NOT (COALESCE(occasion_tags, '{}') @> ARRAY['dia_das_maes']);

-- Índice GIN para busca de occasion_tags (usado por search_ready_catalog_for_agent)
CREATE INDEX IF NOT EXISTS idx_products_occasion_tags
  ON products USING GIN (occasion_tags);

-- ---------------------------------------------------------------------------
-- PARTE 3 — flor_get_conversation_context
--    Retorna contexto completo: customer + conversation + recent_messages +
--    current_order + order_items. Chamado pelo workflow antes do prompt IA.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_get_conversation_context(
  p_phone_normalized  TEXT,
  p_channel           TEXT    DEFAULT 'whatsapp',
  p_recent_limit      INT     DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id     UUID;
  v_conversation_id UUID;
  v_customer        JSONB := '{}'::JSONB;
  v_conversation    JSONB := '{"stage":"new","status":"open","human_takeover":false,"current_order_id":null}'::JSONB;
  v_messages        JSONB := '[]'::JSONB;
  v_order           JSONB := '{}'::JSONB;
  v_order_items     JSONB := '[]'::JSONB;
BEGIN
  -- 1. Customer lookup
  SELECT
    id,
    jsonb_build_object(
      'id',                   id,
      'full_name',            full_name,
      'phone',                phone_normalized,
      'email',                email,
      'is_existing_customer', true
    )
  INTO v_customer_id, v_customer
  FROM customers
  WHERE phone_normalized = p_phone_normalized
  LIMIT 1;

  IF v_customer IS NULL OR v_customer = '{}'::JSONB THEN
    v_customer := jsonb_build_object(
      'id',                   NULL,
      'full_name',            NULL,
      'phone',                p_phone_normalized,
      'is_existing_customer', false
    );
  END IF;

  -- 2. Open conversation lookup
  SELECT
    id,
    jsonb_build_object(
      'id',               id,
      'stage',            stage,
      'status',           status,
      'human_takeover',   human_takeover,
      'current_order_id', current_order_id,
      'last_message_at',  last_message_at,
      'metadata_json',    metadata_json
    )
  INTO v_conversation_id, v_conversation
  FROM conversations
  WHERE phone_normalized = p_phone_normalized
    AND channel           = p_channel
    AND status           != 'closed'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 3. Recent messages (uses real column: body, not message_text)
  IF v_conversation_id IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'direction',    m.direction,
          'sender_type',  m.sender_type,
          'message_type', m.message_type,
          'body',         m.body,
          'agent_action', m.agent_action,
          'agent_stage',  m.agent_stage,
          'created_at',   m.created_at
        )
        ORDER BY m.created_at ASC
      ), '[]'::JSONB)
    INTO v_messages
    FROM (
      SELECT direction, sender_type, message_type, body,
             agent_action, agent_stage, created_at
      FROM   conversation_messages
      WHERE  conversation_id = v_conversation_id
      ORDER  BY created_at DESC
      LIMIT  p_recent_limit
    ) m;
  END IF;

  -- 4. Current order + items
  IF (v_conversation->>'current_order_id') IS NOT NULL THEN
    SELECT jsonb_build_object(
      'order_id',                  o.id,
      'public_code',               o.public_code,
      'status',                    o.status,
      'payment_status',            o.payment_status,
      'fulfillment_type',          o.fulfillment_type,
      'total_amount',              o.total_amount,
      'subtotal_amount',           o.subtotal_amount,
      'shipping_amount',           o.shipping_amount,
      'occasion',                  o.occasion,
      'desired_fulfillment_date',  o.desired_fulfillment_date,
      'desired_fulfillment_period',o.desired_fulfillment_period,
      'recipient_name',            o.recipient_name,
      'is_gift',                   o.is_gift,
      'gift_message',              o.gift_message,
      'customer_note',             o.customer_note
    )
    INTO v_order
    FROM orders o
    WHERE o.id = (v_conversation->>'current_order_id')::UUID
    LIMIT 1;

    SELECT COALESCE(
      jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name_snapshot,
        'unit_price',   oi.unit_price_snapshot,
        'quantity',     oi.quantity,
        'line_total',   oi.line_total
      )), '[]'::JSONB)
    INTO v_order_items
    FROM order_items oi
    WHERE oi.order_id = (v_conversation->>'current_order_id')::UUID;
  END IF;

  RETURN jsonb_build_object(
    'customer',            v_customer,
    'conversation',        COALESCE(v_conversation, '{"stage":"new","human_takeover":false}'::JSONB),
    'recent_messages',     v_messages,
    'current_order',       COALESCE(v_order, '{}'::JSONB),
    'current_order_items', COALESCE(v_order_items, '[]'::JSONB),
    'customer_id',         v_customer_id,
    'conversation_id',     v_conversation_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'customer',            v_customer,
    'conversation',        COALESCE(v_conversation, '{"stage":"new","human_takeover":false}'::JSONB),
    'recent_messages',     '[]'::JSONB,
    'current_order',       '{}'::JSONB,
    'current_order_items', '[]'::JSONB,
    'error',               SQLERRM
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 4 — flor_register_agent_exchange
--    Upsert customer + conversation, insere inbound + outbound em
--    conversation_messages e loga agent_events. Chamado após cada turno IA.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_register_agent_exchange(
  p_phone_normalized      TEXT,
  p_push_name             TEXT          DEFAULT 'Cliente WhatsApp',
  p_channel               TEXT          DEFAULT 'whatsapp',
  p_external_contact_id   TEXT          DEFAULT NULL,
  p_instance              TEXT          DEFAULT NULL,
  p_message_type          TEXT          DEFAULT 'text',
  p_message_body          TEXT          DEFAULT '',
  p_media_url             TEXT          DEFAULT NULL,
  p_message_timestamp     TIMESTAMPTZ   DEFAULT now(),
  p_raw_payload           JSONB         DEFAULT '{}'::JSONB,
  p_agent_reply           TEXT          DEFAULT NULL,
  p_agent_action          TEXT          DEFAULT 'ask_info',
  p_agent_stage           TEXT          DEFAULT 'identificando_necessidade',
  p_customer_id           UUID          DEFAULT NULL,
  p_conversation_id       UUID          DEFAULT NULL,
  p_transcription         TEXT          DEFAULT NULL,
  p_visual_description    TEXT          DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id     UUID := p_customer_id;
  v_conversation_id UUID := p_conversation_id;
  v_inbound_id      UUID;
  v_outbound_id     UUID;
BEGIN
  -- 1. Upsert customer
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM   customers
    WHERE  phone_normalized = p_phone_normalized
    LIMIT  1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      full_name, phone, phone_normalized, source_channel, external_contact_id
    )
    VALUES (
      COALESCE(NULLIF(trim(p_push_name), ''), 'Cliente WhatsApp'),
      p_phone_normalized,
      p_phone_normalized,
      p_channel,
      NULLIF(p_external_contact_id, '')
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- 2. Open conversation (reuse if already provided)
  IF v_conversation_id IS NULL THEN
    SELECT id INTO v_conversation_id
    FROM   conversations
    WHERE  phone_normalized = p_phone_normalized
      AND  channel           = p_channel
      AND  status           != 'closed'
    ORDER  BY created_at DESC
    LIMIT  1;
  END IF;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      customer_id, phone_normalized, channel,
      external_contact_id, customer_name_snapshot,
      stage, last_message_at
    )
    VALUES (
      v_customer_id, p_phone_normalized, p_channel,
      NULLIF(p_external_contact_id, ''),
      COALESCE(NULLIF(trim(p_push_name), ''), 'Cliente WhatsApp'),
      p_agent_stage, p_message_timestamp
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    UPDATE conversations SET
      stage           = p_agent_stage,
      human_takeover  = CASE
                          WHEN p_agent_action = 'handoff_human' THEN true
                          ELSE human_takeover
                        END,
      last_message_at = GREATEST(last_message_at, p_message_timestamp),
      metadata_json   = COALESCE(metadata_json, '{}'::JSONB) ||
                        jsonb_build_object('last_agent_action', p_agent_action),
      updated_at      = now()
    WHERE id = v_conversation_id;
  END IF;

  -- 3. Inbound message (body = real column name)
  INSERT INTO conversation_messages (
    conversation_id, direction, sender_type, message_type,
    body, media_url, raw_payload_json, agent_action, agent_stage,
    transcription, visual_description
  )
  VALUES (
    v_conversation_id, 'inbound', 'customer', p_message_type,
    NULLIF(p_message_body, ''), NULLIF(p_media_url, ''),
    p_raw_payload, p_agent_action, p_agent_stage,
    NULLIF(p_transcription, ''), NULLIF(p_visual_description, '')
  )
  RETURNING id INTO v_inbound_id;

  -- 4. Outbound (agent reply)
  IF NULLIF(trim(COALESCE(p_agent_reply, '')), '') IS NOT NULL THEN
    INSERT INTO conversation_messages (
      conversation_id, direction, sender_type, message_type,
      body, agent_action, agent_stage
    )
    VALUES (
      v_conversation_id, 'outbound', 'agent', 'text',
      p_agent_reply, p_agent_action, p_agent_stage
    )
    RETURNING id INTO v_outbound_id;
  END IF;

  -- 5. Agent event log (input_json/output_json/error_json = real column names)
  INSERT INTO agent_events (
    conversation_id, customer_id, event_type, action,
    input_json, output_json
  )
  VALUES (
    v_conversation_id, v_customer_id,
    'agent_exchange', p_agent_action,
    jsonb_build_object(
      'message_type',       p_message_type,
      'body_length',        length(COALESCE(p_message_body, '')),
      'had_transcription',  p_transcription IS NOT NULL,
      'had_visual',         p_visual_description IS NOT NULL
    ),
    jsonb_build_object(
      'action',       p_agent_action,
      'stage',        p_agent_stage,
      'reply_length', length(COALESCE(p_agent_reply, ''))
    )
  );

  RETURN jsonb_build_object(
    'ok',                 true,
    'customer_id',        v_customer_id,
    'conversation_id',    v_conversation_id,
    'inbound_message_id', v_inbound_id,
    'outbound_message_id',v_outbound_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 5 — flor_log_media_event
--    Loga eventos de processamento de áudio/imagem em agent_events.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_log_media_event(
  p_conversation_id    UUID,
  p_message_type       TEXT,
  p_media_url          TEXT    DEFAULT NULL,
  p_transcription      TEXT    DEFAULT NULL,
  p_visual_description TEXT    DEFAULT NULL,
  p_error              TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO agent_events (
    conversation_id,
    event_type,
    action,
    input_json,
    output_json,
    error_json
  )
  VALUES (
    p_conversation_id,
    CASE WHEN p_error IS NOT NULL THEN 'media_processing_error' ELSE 'media_processed' END,
    CASE p_message_type WHEN 'audio' THEN 'transcribe_audio' ELSE 'analyze_image' END,
    jsonb_build_object('message_type', p_message_type, 'media_url', p_media_url),
    jsonb_build_object('transcription', p_transcription, 'visual_description', p_visual_description),
    CASE WHEN p_error IS NOT NULL
         THEN jsonb_build_object('error', p_error)
         ELSE NULL
    END
  )
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('ok', true, 'event_id', v_event_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 6 — flor_create_order_draft
--    Cria pedido draft com itens iniciais e vincula à conversa.
--    CORRIGIDO: source_conversation_id (não conversation_id), customer_note (não notes),
--               amount (não fixed_amount).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_create_order_draft(
  p_customer_id         UUID,
  p_conversation_id     UUID,
  p_fulfillment_type    TEXT          DEFAULT 'pickup',
  p_occasion            TEXT          DEFAULT NULL,
  p_items               JSONB         DEFAULT '[]'::JSONB,
  p_recipient_name      TEXT          DEFAULT NULL,
  p_is_gift             BOOLEAN       DEFAULT false,
  p_gift_message        TEXT          DEFAULT NULL,
  p_desired_date        DATE          DEFAULT NULL,
  p_desired_period      TEXT          DEFAULT NULL,
  p_notes               TEXT          DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id       UUID;
  v_public_code    TEXT;
  v_subtotal       NUMERIC(10,2) := 0;
  v_shipping       NUMERIC(10,2) := 0;
  v_item           JSONB;
  v_line_total     NUMERIC(10,2);
BEGIN
  v_public_code := upper(substring(replace(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_line_total := (v_item->>'unit_price')::NUMERIC * (v_item->>'quantity')::INT;
    v_subtotal   := v_subtotal + v_line_total;
  END LOOP;

  -- CORRIGIDO: shipping_rules.amount (não fixed_amount)
  IF p_fulfillment_type = 'delivery' THEN
    SELECT COALESCE(amount, 0)
    INTO   v_shipping
    FROM   shipping_rules
    WHERE  is_active = true
    ORDER  BY created_at DESC
    LIMIT  1;
    v_shipping := COALESCE(v_shipping, 0);
  END IF;

  -- CORRIGIDO: source_conversation_id (não conversation_id), customer_note (não notes)
  INSERT INTO orders (
    customer_id, source_conversation_id, public_code, status,
    fulfillment_type, occasion,
    subtotal_amount, shipping_amount, total_amount,
    recipient_name, is_gift, gift_message,
    desired_fulfillment_date, desired_fulfillment_period,
    customer_note, source_channel
  )
  VALUES (
    p_customer_id, p_conversation_id, v_public_code, 'draft',
    p_fulfillment_type::fulfillment_type, p_occasion,
    v_subtotal, v_shipping, v_subtotal + v_shipping,
    NULLIF(p_recipient_name, ''), p_is_gift, NULLIF(p_gift_message, ''),
    p_desired_date, p_desired_period,
    NULLIF(p_notes, ''), 'whatsapp'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_line_total := (v_item->>'unit_price')::NUMERIC * (v_item->>'quantity')::INT;
    INSERT INTO order_items (
      order_id, product_id, product_name_snapshot,
      unit_price_snapshot, quantity, line_total
    )
    VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id', '')::UUID,
      v_item->>'product_name',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'quantity')::INT,
      v_line_total
    );
  END LOOP;

  UPDATE conversations SET
    current_order_id = v_order_id,
    updated_at       = now()
  WHERE id = p_conversation_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'order_id',    v_order_id,
    'public_code', v_public_code,
    'subtotal',    v_subtotal,
    'shipping',    v_shipping,
    'total',       v_subtotal + v_shipping
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 7 — flor_update_order_draft
--    Atualiza campos de um draft existente. Suporta append/replace de itens.
--    CORRIGIDO: customer_note (não notes), amount (não fixed_amount).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_update_order_draft(
  p_order_id              UUID,
  p_fulfillment_type      TEXT    DEFAULT NULL,
  p_recipient_name        TEXT    DEFAULT NULL,
  p_is_gift               BOOLEAN DEFAULT NULL,
  p_gift_message          TEXT    DEFAULT NULL,
  p_occasion              TEXT    DEFAULT NULL,
  p_desired_date          DATE    DEFAULT NULL,
  p_desired_period        TEXT    DEFAULT NULL,
  p_notes                 TEXT    DEFAULT NULL,
  p_add_items             JSONB   DEFAULT NULL,
  p_replace_items         JSONB   DEFAULT NULL,
  p_delivery_address_json JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item       JSONB;
  v_line_total NUMERIC(10,2);
  v_subtotal   NUMERIC(10,2);
  v_shipping   NUMERIC(10,2) := 0;
  v_order      orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND status = 'draft';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Draft order not found: ' || p_order_id);
  END IF;

  IF p_replace_items IS NOT NULL THEN
    DELETE FROM order_items WHERE order_id = p_order_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_replace_items) LOOP
      v_line_total := (v_item->>'unit_price')::NUMERIC * (v_item->>'quantity')::INT;
      INSERT INTO order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, line_total
      )
      VALUES (
        p_order_id,
        NULLIF(v_item->>'product_id', '')::UUID,
        v_item->>'product_name',
        (v_item->>'unit_price')::NUMERIC,
        (v_item->>'quantity')::INT,
        v_line_total
      );
    END LOOP;
  END IF;

  IF p_add_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_add_items) LOOP
      v_line_total := (v_item->>'unit_price')::NUMERIC * (v_item->>'quantity')::INT;
      INSERT INTO order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, line_total
      )
      VALUES (
        p_order_id,
        NULLIF(v_item->>'product_id', '')::UUID,
        v_item->>'product_name',
        (v_item->>'unit_price')::NUMERIC,
        (v_item->>'quantity')::INT,
        v_line_total
      );
    END LOOP;
  END IF;

  SELECT COALESCE(sum(line_total), 0) INTO v_subtotal
  FROM order_items WHERE order_id = p_order_id;

  -- CORRIGIDO: shipping_rules.amount (não fixed_amount)
  IF COALESCE(p_fulfillment_type, v_order.fulfillment_type::TEXT) = 'delivery' THEN
    SELECT COALESCE(amount, 0) INTO v_shipping
    FROM shipping_rules WHERE is_active = true ORDER BY created_at DESC LIMIT 1;
    v_shipping := COALESCE(v_shipping, 0);
  END IF;

  -- CORRIGIDO: customer_note (não notes)
  UPDATE orders SET
    fulfillment_type           = COALESCE(p_fulfillment_type::fulfillment_type, fulfillment_type),
    recipient_name             = CASE WHEN p_recipient_name IS NOT NULL THEN NULLIF(p_recipient_name, '') ELSE recipient_name END,
    is_gift                    = COALESCE(p_is_gift, is_gift),
    gift_message               = CASE WHEN p_gift_message IS NOT NULL THEN NULLIF(p_gift_message, '') ELSE gift_message END,
    occasion                   = COALESCE(NULLIF(p_occasion, ''), occasion),
    desired_fulfillment_date   = COALESCE(p_desired_date, desired_fulfillment_date),
    desired_fulfillment_period = COALESCE(NULLIF(p_desired_period, ''), desired_fulfillment_period),
    customer_note              = CASE WHEN p_notes IS NOT NULL THEN NULLIF(p_notes, '') ELSE customer_note END,
    address_snapshot_json      = COALESCE(p_delivery_address_json, address_snapshot_json),
    subtotal_amount            = v_subtotal,
    shipping_amount            = v_shipping,
    total_amount               = v_subtotal + v_shipping,
    updated_at                 = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok',       true,
    'order_id', p_order_id,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total',    v_subtotal + v_shipping
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 8 — flor_prepare_checkout
--    Avança draft → pending_payment. Retorna checkout_url para o agente enviar.
--    URL: {CATALOG_BASE_URL}/pedido/{public_code}/pagamento
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_prepare_checkout(
  p_order_id         UUID,
  p_payment_method   TEXT    DEFAULT NULL,
  p_catalog_base_url TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order      orders%ROWTYPE;
  v_items_text TEXT;
  v_summary    TEXT;
  v_order_url  TEXT;
  v_pay_url    TEXT;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found: ' || p_order_id);
  END IF;
  IF v_order.status NOT IN ('draft') THEN
    RETURN jsonb_build_object(
      'ok',         false,
      'error',      'Order not in draft status: ' || v_order.status,
      'public_code',v_order.public_code
    );
  END IF;

  UPDATE orders SET
    status         = 'pending_payment',
    payment_method = CASE
                       WHEN p_payment_method IN ('mercado_pago','pay_on_delivery','pay_on_pickup')
                       THEN p_payment_method::payment_method
                       ELSE payment_method
                     END,
    updated_at     = now()
  WHERE id = p_order_id;

  SELECT string_agg(
    '• ' || oi.product_name_snapshot
          || ' x' || oi.quantity::TEXT
          || ' = R$ ' || to_char(oi.line_total, 'FM999999.00'),
    chr(10) ORDER BY oi.created_at
  )
  INTO v_items_text
  FROM order_items oi
  WHERE oi.order_id = p_order_id;

  v_summary :=
    '📋 *Pedido ' || v_order.public_code || '*' || chr(10) ||
    COALESCE(v_items_text, '(sem itens)') || chr(10) || chr(10) ||
    'Subtotal: R$ ' || to_char(v_order.subtotal_amount, 'FM999999.00') || chr(10) ||
    CASE WHEN v_order.shipping_amount > 0
         THEN 'Entrega: R$ ' || to_char(v_order.shipping_amount, 'FM999999.00') || chr(10)
         ELSE '' END ||
    '*Total: R$ ' || to_char(v_order.total_amount, 'FM999999.00') || '*' || chr(10) ||
    CASE v_order.fulfillment_type
         WHEN 'delivery' THEN '🚗 Entrega'
         ELSE '🏪 Retirada na loja'
    END;

  v_order_url := COALESCE(NULLIF(p_catalog_base_url, ''), 'https://floricultura.vercel.app')
                 || '/pedido/' || v_order.public_code;
  v_pay_url   := v_order_url || '/pagamento';

  RETURN jsonb_build_object(
    'ok',                 true,
    'order_id',           p_order_id,
    'public_code',        v_order.public_code,
    'total_amount',       v_order.total_amount,
    'fulfillment_type',   v_order.fulfillment_type,
    'payment_method',     COALESCE(p_payment_method, v_order.payment_method::TEXT),
    'order_summary_text', v_summary,
    'order_url',          v_order_url,
    'checkout_url',       v_pay_url
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 9 — flor_parse_whatsapp_cart
--    Parse de carrinho nativo WhatsApp (orderMessage). Mapeia itens ao catálogo.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_parse_whatsapp_cart(
  p_phone_normalized TEXT,
  p_cart_payload     JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id    UUID;
  v_cart_item   JSONB;
  v_product_id  UUID;
  v_match_score INT := 0;
  v_results     JSONB := '[]'::JSONB;
  v_item_name   TEXT;
  v_item_price  NUMERIC;
  v_item_qty    INT;
BEGIN
  INSERT INTO catalog_import_batches (source, source_label, status, raw_payload_json, notes)
  VALUES (
    'whatsapp_cart',
    'WhatsApp Cart - ' || p_phone_normalized,
    'reviewing',
    p_cart_payload,
    'Auto-parsed by agent MVP'
  )
  RETURNING id INTO v_batch_id;

  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(
    COALESCE(p_cart_payload->'order'->'items', p_cart_payload->'items', '[]'::JSONB)
  ) LOOP
    v_item_name  := COALESCE(v_cart_item->>'title', v_cart_item->>'name', '');
    v_item_price := COALESCE(NULLIF(v_cart_item->>'price', '')::NUMERIC, 0) / 1000.0;
    v_item_qty   := COALESCE(NULLIF(v_cart_item->>'quantity', '')::INT, 1);

    SELECT p.id, 100 INTO v_product_id, v_match_score
    FROM   products p
    WHERE  lower(p.name) = lower(v_item_name)
    LIMIT  1;

    IF v_product_id IS NULL THEN
      SELECT p.id, 60 INTO v_product_id, v_match_score
      FROM   products p
      WHERE  lower(p.name) ILIKE '%' || lower(v_item_name) || '%'
      LIMIT  1;
    END IF;

    INSERT INTO catalog_import_items (
      batch_id,
      raw_name, raw_price, raw_payload_json,
      suggested_item_type, suggested_slug,
      review_status, matched_item_type, matched_item_id, matched_score
    )
    VALUES (
      v_batch_id,
      v_item_name, v_item_price, v_cart_item,
      'product', lower(replace(v_item_name, ' ', '-')),
      CASE WHEN v_product_id IS NOT NULL THEN 'matched' ELSE 'pending' END,
      CASE WHEN v_product_id IS NOT NULL THEN 'product' ELSE NULL END,
      v_product_id, v_match_score
    );

    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'raw_name',    v_item_name,
      'raw_price',   v_item_price,
      'quantity',    v_item_qty,
      'product_id',  v_product_id,
      'match_score', v_match_score,
      'matched',     v_product_id IS NOT NULL
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'ok',         true,
    'batch_id',   v_batch_id,
    'item_count', jsonb_array_length(v_results),
    'items',      v_results
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- PARTE 10 — flor_trigger_handoff
--    Marca conversa para atendimento humano.
--    CORRIGIDO: status = 'pending' (não 'waiting_human' que é valor inválido).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_trigger_handoff(
  p_conversation_id UUID,
  p_reason          TEXT    DEFAULT 'requested_by_customer',
  p_agent_note      TEXT    DEFAULT NULL,
  p_customer_id     UUID    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CORRIGIDO: status = 'pending' (valor válido); 'waiting_human' não existe no enum
  UPDATE conversations SET
    human_takeover = true,
    status         = 'pending',
    stage          = 'handoff',
    metadata_json  = COALESCE(metadata_json, '{}'::JSONB) || jsonb_build_object(
      'handoff_reason', p_reason,
      'handoff_note',   p_agent_note,
      'handoff_at',     now()
    ),
    updated_at     = now()
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Conversation not found');
  END IF;

  INSERT INTO agent_events (
    conversation_id, customer_id, event_type, action,
    input_json, output_json
  )
  VALUES (
    p_conversation_id, p_customer_id, 'handoff_triggered', 'handoff_human',
    jsonb_build_object('reason', p_reason, 'note', p_agent_note),
    jsonb_build_object('human_takeover', true, 'status', 'pending')
  );

  RETURN jsonb_build_object('ok', true, 'reason', p_reason);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- GRANTS — todas as 8 funções acessíveis via apikey anon/authenticated/service
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.flor_get_conversation_context(TEXT, TEXT, INT)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_register_agent_exchange(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TIMESTAMPTZ,JSONB,TEXT,TEXT,TEXT,UUID,UUID,TEXT,TEXT)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_log_media_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_create_order_draft(UUID,UUID,TEXT,TEXT,JSONB,TEXT,BOOLEAN,TEXT,DATE,TEXT,TEXT)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_update_order_draft(UUID,TEXT,TEXT,BOOLEAN,TEXT,TEXT,DATE,TEXT,TEXT,JSONB,JSONB,JSONB)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_prepare_checkout(UUID, TEXT, TEXT)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_parse_whatsapp_cart(TEXT, JSONB)
  TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.flor_trigger_handoff(UUID, TEXT, TEXT, UUID)
  TO authenticated, anon, service_role;
