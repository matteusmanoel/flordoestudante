-- Sprint 5: RPCs de contexto e registro do agente IA
-- flor_get_conversation_context: retorna contexto completo para o prompt da IA
-- flor_register_agent_exchange: registra exchange inbound+outbound do agente IA

-- ============================================================
-- RPC: flor_get_conversation_context
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_get_conversation_context(
  p_phone_normalized TEXT,
  p_channel TEXT DEFAULT 'whatsapp',
  p_recent_messages_limit INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_customer JSONB;
  v_conversation JSONB;
  v_recent_messages JSONB;
  v_current_order JSONB;
  v_conversation_id UUID;
  v_customer_id UUID;
BEGIN
  -- Buscar customer
  SELECT
    jsonb_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'phone', c.phone_normalized,
      'email', c.email,
      'source_channel', c.source_channel,
      'is_existing_customer', true
    ),
    c.id
  INTO v_customer, v_customer_id
  FROM customers c
  WHERE c.phone_normalized = p_phone_normalized
  LIMIT 1;

  IF v_customer IS NULL THEN
    v_customer := jsonb_build_object(
      'id', null,
      'full_name', null,
      'phone', p_phone_normalized,
      'is_existing_customer', false
    );
  END IF;

  -- Buscar conversation mais recente
  SELECT
    jsonb_build_object(
      'id', cv.id,
      'stage', cv.stage,
      'human_takeover', cv.human_takeover,
      'last_agent_action', cv.last_agent_action,
      'current_order_id', cv.current_order_id,
      'last_message_at', cv.last_message_at
    ),
    cv.id
  INTO v_conversation, v_conversation_id
  FROM conversations cv
  WHERE cv.phone_normalized = p_phone_normalized
    AND cv.channel = p_channel
  ORDER BY cv.created_at DESC
  LIMIT 1;

  IF v_conversation IS NULL THEN
    v_conversation := jsonb_build_object(
      'id', null,
      'stage', 'new',
      'human_takeover', false,
      'last_agent_action', null,
      'current_order_id', null
    );
  END IF;

  -- Buscar mensagens recentes
  IF v_conversation_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'direction', m.direction,
        'message_type', m.message_type,
        'message_text', m.message_text,
        'sent_at', m.sent_at
      ) ORDER BY m.sent_at ASC
    )
    INTO v_recent_messages
    FROM (
      SELECT direction, message_type, message_text, sent_at
      FROM conversation_messages
      WHERE conversation_id = v_conversation_id
      ORDER BY sent_at DESC
      LIMIT p_recent_messages_limit
    ) m;
  END IF;

  v_recent_messages := COALESCE(v_recent_messages, '[]'::JSONB);

  -- Buscar pedido em rascunho atual
  IF (v_conversation->>'current_order_id') IS NOT NULL THEN
    SELECT jsonb_build_object(
      'order_id', o.id,
      'public_code', o.public_code,
      'status', o.status,
      'fulfillment_type', o.fulfillment_type,
      'subtotal_amount', o.subtotal_amount,
      'shipping_amount', o.shipping_amount,
      'total_amount', o.total_amount,
      'payment_status', o.payment_status,
      'occasion', o.occasion,
      'desired_fulfillment_date', o.desired_fulfillment_date,
      'desired_fulfillment_period', o.desired_fulfillment_period,
      'recipient_name', o.recipient_name,
      'recipient_phone', o.recipient_phone,
      'is_gift', o.is_gift,
      'surprise_delivery', o.surprise_delivery,
      'gift_message', o.gift_message,
      'address_snapshot_json', o.address_snapshot_json
    )
    INTO v_current_order
    FROM orders o
    WHERE o.id = (v_conversation->>'current_order_id')::UUID
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'customer', v_customer,
    'conversation', v_conversation,
    'recent_messages', v_recent_messages,
    'current_order', COALESCE(v_current_order, '{}'::JSONB),
    'customer_id', v_customer_id,
    'conversation_id', v_conversation_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'customer', v_customer,
    'conversation', COALESCE(v_conversation, '{"stage":"new","human_takeover":false}'::JSONB),
    'recent_messages', '[]'::JSONB,
    'current_order', '{}'::JSONB,
    'error', SQLERRM
  );
END;
$$;

-- ============================================================
-- RPC: flor_register_agent_exchange
-- Usada no Sprint 5+ quando a reply vem do agente IA
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_register_agent_exchange(
  -- Campos do inbound
  p_phone_normalized TEXT,
  p_push_name TEXT DEFAULT 'Cliente WhatsApp',
  p_channel TEXT DEFAULT 'whatsapp',
  p_external_contact_id TEXT DEFAULT NULL,
  p_remote_jid TEXT DEFAULT NULL,
  p_instance TEXT DEFAULT NULL,
  p_message_id TEXT DEFAULT NULL,
  p_message_type TEXT DEFAULT 'text',
  p_message_text TEXT DEFAULT '',
  p_message_text_normalized TEXT DEFAULT '',
  p_message_timestamp TIMESTAMPTZ DEFAULT now(),
  p_raw_payload JSONB DEFAULT '{}'::JSONB,
  -- Campos do agente IA
  p_agent_reply TEXT DEFAULT NULL,
  p_agent_action TEXT DEFAULT 'ask_info',
  p_agent_stage TEXT DEFAULT 'identificando_necessidade',
  p_agent_json JSONB DEFAULT '{}'::JSONB,
  -- IDs já conhecidos (opcional, para evitar re-lookup)
  p_customer_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID := p_customer_id;
  v_conversation_id UUID := p_conversation_id;
  v_inbound_message_id UUID;
  v_outbound_message_id UUID;
BEGIN
  -- ============================================================
  -- 1. Upsert customer
  -- ============================================================
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM customers
    WHERE phone_normalized = p_phone_normalized
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      full_name, phone, phone_normalized, source_channel, external_contact_id
    )
    VALUES (
      COALESCE(NULLIF(trim(p_push_name),''), 'Cliente WhatsApp'),
      p_phone_normalized, p_phone_normalized, p_channel,
      NULLIF(p_external_contact_id,'')
    )
    ON CONFLICT (phone_normalized) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_customer_id;
  END IF;

  -- ============================================================
  -- 2. Upsert conversation
  -- ============================================================
  IF v_conversation_id IS NULL THEN
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE phone_normalized = p_phone_normalized AND channel = p_channel
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      customer_id, phone_normalized, channel, remote_jid, instance,
      stage, last_message_at
    )
    VALUES (
      v_customer_id, p_phone_normalized, p_channel,
      NULLIF(p_remote_jid,''), NULLIF(p_instance,''),
      p_agent_stage::conversation_stage, p_message_timestamp
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    UPDATE conversations SET
      stage = p_agent_stage::conversation_stage,
      human_takeover = CASE
        WHEN p_agent_action = 'handoff_human' THEN true
        ELSE human_takeover
      END,
      last_message_at = p_message_timestamp,
      last_agent_action = p_agent_action,
      context_json = p_agent_json,
      updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  -- ============================================================
  -- 3. Registrar inbound (idempotente por message_id)
  -- ============================================================
  IF NULLIF(p_message_id,'') IS NOT NULL THEN
    SELECT id INTO v_inbound_message_id
    FROM conversation_messages
    WHERE message_id = p_message_id
    LIMIT 1;
  END IF;

  IF v_inbound_message_id IS NULL THEN
    INSERT INTO conversation_messages (
      conversation_id, customer_id, direction, message_id,
      message_type, message_text, message_text_normalized,
      raw_payload_json, sent_at
    )
    VALUES (
      v_conversation_id, v_customer_id, 'inbound', NULLIF(p_message_id,''),
      p_message_type, p_message_text, p_message_text_normalized,
      p_raw_payload, p_message_timestamp
    )
    RETURNING id INTO v_inbound_message_id;
  END IF;

  -- ============================================================
  -- 4. Registrar outbound (reply do agente IA)
  -- ============================================================
  IF NULLIF(p_agent_reply,'') IS NOT NULL THEN
    INSERT INTO conversation_messages (
      conversation_id, customer_id, direction, message_type, message_text, sent_at
    )
    VALUES (
      v_conversation_id, v_customer_id, 'outbound', 'text', p_agent_reply, now()
    )
    RETURNING id INTO v_outbound_message_id;
  END IF;

  -- ============================================================
  -- 5. Registrar agent_event
  -- ============================================================
  INSERT INTO agent_events (
    conversation_id, customer_id, event_type, action, stage_after, payload_json
  )
  VALUES (
    v_conversation_id, v_customer_id,
    'agent_exchange', p_agent_action, p_agent_stage,
    jsonb_build_object(
      'message_type', p_message_type,
      'agent_json_keys', (
        SELECT jsonb_agg(key) FROM jsonb_object_keys(p_agent_json) AS key
      )
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'customer_id', v_customer_id,
    'conversation_id', v_conversation_id,
    'inbound_message_id', v_inbound_message_id,
    'outbound_message_id', v_outbound_message_id,
    'phone_normalized', p_phone_normalized,
    'channel', p_channel
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'phone_normalized', p_phone_normalized
  );
END;
$$;

COMMENT ON FUNCTION public.flor_get_conversation_context IS
  'Sprint 5: retorna contexto completo para o prompt do agente IA '
  '(customer, conversation, recent_messages, current_order).';

COMMENT ON FUNCTION public.flor_register_agent_exchange IS
  'Sprint 5: persiste exchange inbound+outbound com reply vindo do agente IA. '
  'Substitui flor_register_inbound_sprint3 no Sprint 5.';
