-- =============================================================================
-- 00021_flor_core_agent_rpcs_v2.sql
--
-- Corrected core agent RPCs aligned with the REAL production schema.
-- Applies on top of the current live DB state (post Sprint 3).
--
-- DO NOT apply migrations 00013-00020 to the current production DB.
-- Those migrations reflect a schema that never reached production.
-- The valid migration sequence for the current DB is: 00021, 00022, 00023.
--
-- Security: SECURITY DEFINER only. RLS policies are in 00024 (separate, optional).
-- =============================================================================

-- Real column reference guide (validated via Supabase MCP):
--   conversations:          external_contact_id, phone_normalized, channel,
--                           customer_name_snapshot, stage, status, human_takeover,
--                           current_order_id, last_message_at, metadata_json
--   conversation_messages:  conversation_id, direction, sender_type, message_type,
--                           body, media_url, raw_payload_json, agent_action,
--                           agent_stage, created_at
--   agent_events:           conversation_id, customer_id, event_type, action,
--                           input_json, output_json, error_json, created_at
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. flor_get_conversation_context
--    Returns customer + conversation + recent_messages + current_order + items
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
      'id',                  id,
      'full_name',           full_name,
      'phone',               phone_normalized,
      'email',               email,
      'is_existing_customer', true
    )
  INTO v_customer_id, v_customer
  FROM customers
  WHERE phone_normalized = p_phone_normalized
  LIMIT 1;

  IF v_customer IS NULL OR v_customer = '{}'::JSONB THEN
    v_customer := jsonb_build_object(
      'id',                  NULL,
      'full_name',           NULL,
      'phone',               p_phone_normalized,
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

  -- 3. Recent messages
  IF v_conversation_id IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'direction',   m.direction,
          'sender_type', m.sender_type,
          'message_type',m.message_type,
          'body',        m.body,
          'agent_action',m.agent_action,
          'agent_stage', m.agent_stage,
          'created_at',  m.created_at
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
      'order_id',                 o.id,
      'public_code',              o.public_code,
      'status',                   o.status,
      'fulfillment_type',         o.fulfillment_type,
      'total_amount',             o.total_amount,
      'subtotal_amount',          o.subtotal_amount,
      'occasion',                 o.occasion,
      'desired_fulfillment_date', o.desired_fulfillment_date,
      'desired_fulfillment_period',o.desired_fulfillment_period,
      'recipient_name',           o.recipient_name,
      'is_gift',                  o.is_gift,
      'gift_message',             o.gift_message
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
    'customer',           v_customer,
    'conversation',       COALESCE(v_conversation, '{"stage":"new","human_takeover":false}'::JSONB),
    'recent_messages',    v_messages,
    'current_order',      COALESCE(v_order, '{}'::JSONB),
    'current_order_items',COALESCE(v_order_items, '[]'::JSONB),
    'customer_id',        v_customer_id,
    'conversation_id',    v_conversation_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'customer',           v_customer,
    'conversation',       COALESCE(v_conversation, '{"stage":"new","human_takeover":false}'::JSONB),
    'recent_messages',    '[]'::JSONB,
    'current_order',      '{}'::JSONB,
    'current_order_items','[]'::JSONB,
    'error',              SQLERRM
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. flor_register_agent_exchange
--    Upserts customer + conversation, inserts inbound+outbound messages and
--    logs an agent_events record. Used by the workflow after every AI turn.
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
  -- 1. Upsert customer (SELECT first to avoid constraint issues)
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM   customers
    WHERE  phone_normalized = p_phone_normalized
    LIMIT  1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (full_name, phone, phone_normalized, source_channel, external_contact_id)
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

  -- 3. Inbound message
  INSERT INTO conversation_messages (
    conversation_id, direction, sender_type, message_type,
    body, media_url, raw_payload_json, agent_action, agent_stage
  )
  VALUES (
    v_conversation_id, 'inbound', 'customer', p_message_type,
    NULLIF(p_message_body, ''), NULLIF(p_media_url, ''),
    p_raw_payload, p_agent_action, p_agent_stage
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

  -- 5. Agent event log
  INSERT INTO agent_events (
    conversation_id, customer_id, event_type, action,
    input_json, output_json
  )
  VALUES (
    v_conversation_id, v_customer_id,
    'agent_exchange', p_agent_action,
    jsonb_build_object(
      'message_type',        p_message_type,
      'body_length',         length(COALESCE(p_message_body, '')),
      'had_transcription',   p_transcription IS NOT NULL,
      'had_visual',          p_visual_description IS NOT NULL
    ),
    jsonb_build_object(
      'action',        p_agent_action,
      'stage',         p_agent_stage,
      'reply_length',  length(COALESCE(p_agent_reply, ''))
    )
  );

  RETURN jsonb_build_object(
    'ok',                true,
    'customer_id',       v_customer_id,
    'conversation_id',   v_conversation_id,
    'inbound_message_id',v_inbound_id,
    'outbound_message_id',v_outbound_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. flor_log_media_event
--    Logs audio/image processing results or failures to agent_events.
--    Called by the workflow when media processing succeeds or fails.
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

-- Permissions (service_role already has full access; anon/authenticated may call via apikey)
GRANT EXECUTE ON FUNCTION public.flor_get_conversation_context(TEXT, TEXT, INT)         TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.flor_register_agent_exchange(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TIMESTAMPTZ,JSONB,TEXT,TEXT,TEXT,UUID,UUID,TEXT,TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.flor_log_media_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
