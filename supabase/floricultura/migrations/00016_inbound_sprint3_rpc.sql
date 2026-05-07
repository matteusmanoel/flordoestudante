-- Sprint 3 backfill: RPC de registro de inbound WhatsApp
-- Cria ou substitui a RPC flor_register_inbound_sprint3
-- Lógica: upsert customer, upsert conversation, insere mensagem inbound,
-- gera resposta determinística e registra outbound + agent_event

CREATE OR REPLACE FUNCTION public.flor_register_inbound_sprint3(
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
  p_raw_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_conversation_id UUID;
  v_inbound_message_id UUID;
  v_outbound_message_id UUID;
  v_reply TEXT;
  v_agent_action TEXT := 'ask_info';
  v_agent_stage TEXT := 'new';
  v_is_new_customer BOOLEAN := false;
BEGIN
  -- ============================================================
  -- 1. Upsert customer pelo phone_normalized
  -- ============================================================
  SELECT id INTO v_customer_id
  FROM customers
  WHERE phone_normalized = p_phone_normalized
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      full_name, phone, phone_normalized,
      source_channel, external_contact_id
    )
    VALUES (
      COALESCE(NULLIF(trim(p_push_name),''), 'Cliente WhatsApp'),
      p_phone_normalized,
      p_phone_normalized,
      p_channel,
      NULLIF(p_external_contact_id, '')
    )
    ON CONFLICT (external_contact_id)
    DO UPDATE SET
      phone_normalized = EXCLUDED.phone_normalized,
      source_channel = EXCLUDED.source_channel,
      updated_at = now()
    RETURNING id INTO v_customer_id;

    v_is_new_customer := true;
  ELSE
    UPDATE customers SET
      full_name = CASE
        WHEN full_name IN ('Cliente WhatsApp','') AND NULLIF(trim(p_push_name),'') IS NOT NULL
        THEN p_push_name ELSE full_name
      END,
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- ============================================================
  -- 2. Upsert conversation pelo phone_normalized + channel
  -- ============================================================
  SELECT id, stage INTO v_conversation_id, v_agent_stage
  FROM conversations
  WHERE phone_normalized = p_phone_normalized
    AND channel = p_channel
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      customer_id, phone_normalized, channel,
      remote_jid, instance, stage, last_message_at
    )
    VALUES (
      v_customer_id, p_phone_normalized, p_channel,
      NULLIF(p_remote_jid,''), NULLIF(p_instance,''),
      'new', p_message_timestamp
    )
    RETURNING id INTO v_conversation_id;
    v_agent_stage := 'new';
  ELSE
    UPDATE conversations SET
      customer_id = COALESCE(customer_id, v_customer_id),
      last_message_at = p_message_timestamp,
      updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  -- ============================================================
  -- 3. Guardar mensagem inbound (idempotente pelo message_id)
  -- ============================================================
  IF NULLIF(p_message_id, '') IS NOT NULL THEN
    -- Verificar se já foi processado (anti-duplicidade via DB)
    SELECT id INTO v_inbound_message_id
    FROM conversation_messages
    WHERE message_id = p_message_id
    LIMIT 1;
  END IF;

  IF v_inbound_message_id IS NULL THEN
    INSERT INTO conversation_messages (
      conversation_id, customer_id, direction,
      message_id, message_type, message_text,
      message_text_normalized, raw_payload_json, sent_at
    )
    VALUES (
      v_conversation_id, v_customer_id, 'inbound',
      NULLIF(p_message_id,''), p_message_type, p_message_text,
      p_message_text_normalized, p_raw_payload, p_message_timestamp
    )
    RETURNING id INTO v_inbound_message_id;
  END IF;

  -- ============================================================
  -- 4. Gerar reply determinístico (será substituído pelo agente IA no Sprint 5)
  -- ============================================================
  IF p_message_type = 'cart' THEN
    v_reply := 'Recebi seu pedido! 🌸 Já estou verificando os itens para você. Um momento!';
    v_agent_action := 'parse_whatsapp_cart';
  ELSIF v_agent_stage = 'new' OR v_agent_stage = 'identificando_necessidade' THEN
    IF p_message_text_normalized ~ '(oi|ola|bom dia|boa tarde|boa noite|hey|ola)' THEN
      v_reply := 'Olá! 🌸 Bem-vindo à *Flor do Estudante*! Sou a Julia, sua consultora virtual. Como posso te ajudar hoje?';
      v_agent_stage := 'identificando_necessidade';
      v_agent_action := 'ask_info';
    ELSIF p_message_text_normalized ~ '(flor|buque|arranjo|cesta|presente|roses|girassol|presente)' THEN
      v_reply := 'Que ótimo! 🌻 Adoro ajudar com presentes especiais. Me conta: *para quem é* e *qual a ocasião*? Assim posso te sugerir as melhores opções!';
      v_agent_stage := 'coletando_ocasiao';
      v_agent_action := 'ask_info';
    ELSE
      v_reply := 'Olá! 🌸 Sou a Julia da *Flor do Estudante*. Posso te ajudar a escolher flores, buquês e presentes especiais. O que você está buscando?';
      v_agent_stage := 'identificando_necessidade';
      v_agent_action := 'ask_info';
    END IF;
  ELSIF p_message_text_normalized ~ '(atendente|humano|pessoa|falar com alguem|responsavel)' THEN
    v_reply := 'Claro! Vou chamar um de nossos atendentes para te ajudar. Um momento! 💛';
    v_agent_action := 'handoff_human';
    v_agent_stage := 'handoff';
  ELSE
    v_reply := 'Entendi! 🌸 Deixa eu ver as melhores opções para você. Um momento!';
    v_agent_action := 'ask_info';
  END IF;

  -- ============================================================
  -- 5. Atualizar stage da conversa
  -- ============================================================
  UPDATE conversations SET
    stage = v_agent_stage::conversation_stage,
    human_takeover = CASE WHEN v_agent_action = 'handoff_human' THEN true ELSE human_takeover END,
    last_agent_action = v_agent_action,
    updated_at = now()
  WHERE id = v_conversation_id;

  -- ============================================================
  -- 6. Registrar outbound planejado
  -- ============================================================
  INSERT INTO conversation_messages (
    conversation_id, customer_id, direction,
    message_type, message_text, sent_at
  )
  VALUES (
    v_conversation_id, v_customer_id, 'outbound',
    'text', v_reply, now()
  )
  RETURNING id INTO v_outbound_message_id;

  -- ============================================================
  -- 7. Registrar agent_event
  -- ============================================================
  INSERT INTO agent_events (
    conversation_id, customer_id,
    event_type, action, stage_after, payload_json
  )
  VALUES (
    v_conversation_id, v_customer_id,
    'inbound_processed', v_agent_action, v_agent_stage,
    jsonb_build_object(
      'message_type', p_message_type,
      'is_new_customer', v_is_new_customer,
      'reply_length', length(v_reply)
    )
  );

  -- ============================================================
  -- 8. Retornar
  -- ============================================================
  RETURN jsonb_build_object(
    'ok', true,
    'customer_id', v_customer_id,
    'conversation_id', v_conversation_id,
    'inbound_message_id', v_inbound_message_id,
    'outbound_message_id', v_outbound_message_id,
    'reply', v_reply,
    'agent_action', v_agent_action,
    'agent_stage', v_agent_stage,
    'phone_normalized', p_phone_normalized,
    'channel', p_channel
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'reply', 'Olá! Tive um probleminha técnico. Por favor, tente novamente em instantes. 🌸',
    'agent_action', 'ask_info',
    'agent_stage', 'new',
    'phone_normalized', p_phone_normalized,
    'channel', p_channel
  );
END;
$$;

COMMENT ON FUNCTION public.flor_register_inbound_sprint3 IS
  'Sprint 3: persiste inbound WhatsApp, faz upsert customer/conversation, '
  'gera reply determinístico. Substituir pelo agente IA no Sprint 5.';
