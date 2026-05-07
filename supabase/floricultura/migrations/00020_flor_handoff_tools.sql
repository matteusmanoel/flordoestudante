-- Sprint 11: RPC de handoff humano e view de CRM mínimo

-- ============================================================
-- RPC: flor_trigger_handoff
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_trigger_handoff(
  p_conversation_id UUID,
  p_reason TEXT DEFAULT 'solicitado_pelo_cliente',
  p_summary TEXT DEFAULT NULL,
  p_pending_fields TEXT[] DEFAULT '{}',
  p_next_human_action TEXT DEFAULT NULL,
  p_agent_json JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_phone_normalized TEXT;
  v_current_order_id UUID;
BEGIN
  -- Recuperar dados da conversa
  SELECT customer_id, phone_normalized, current_order_id
  INTO v_customer_id, v_phone_normalized, v_current_order_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Conversa não encontrada: ' || p_conversation_id);
  END IF;

  -- Marcar conversa como human_takeover
  UPDATE conversations SET
    human_takeover = true,
    stage = 'handoff'::conversation_stage,
    last_agent_action = 'handoff_human',
    context_json = COALESCE(context_json, '{}') || jsonb_build_object(
      'handoff_reason', p_reason,
      'handoff_summary', p_summary,
      'pending_fields', p_pending_fields,
      'next_human_action', p_next_human_action,
      'handoff_at', now()
    ),
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Registrar agent_event
  INSERT INTO agent_events (
    conversation_id, customer_id,
    event_type, action, stage_after, payload_json
  )
  VALUES (
    p_conversation_id, v_customer_id,
    'handoff_triggered', 'handoff_human', 'handoff',
    jsonb_build_object(
      'reason', p_reason,
      'summary', p_summary,
      'pending_fields', p_pending_fields,
      'next_human_action', p_next_human_action,
      'current_order_id', v_current_order_id,
      'agent_json_snapshot', p_agent_json
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'conversation_id', p_conversation_id,
    'customer_id', v_customer_id,
    'phone_normalized', v_phone_normalized,
    'current_order_id', v_current_order_id,
    'handoff_reason', p_reason,
    'summary', p_summary,
    'pending_fields', p_pending_fields
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- View: CRM mínimo de conversas para painel admin
-- ============================================================

CREATE OR REPLACE VIEW vw_admin_conversations AS
SELECT
  cv.id AS conversation_id,
  cv.phone_normalized,
  cv.channel,
  cv.stage,
  cv.human_takeover,
  cv.last_message_at,
  cv.last_agent_action,
  cv.current_order_id,
  cv.created_at AS conversation_started_at,
  c.id AS customer_id,
  c.full_name AS customer_name,
  c.email AS customer_email,
  o.public_code AS current_order_code,
  o.status AS current_order_status,
  o.total_amount AS current_order_total,
  (
    SELECT m.message_text
    FROM conversation_messages m
    WHERE m.conversation_id = cv.id
    ORDER BY m.sent_at DESC
    LIMIT 1
  ) AS last_message_text
FROM conversations cv
LEFT JOIN customers c ON c.id = cv.customer_id
LEFT JOIN orders o ON o.id = cv.current_order_id
ORDER BY cv.last_message_at DESC NULLS LAST;

-- ============================================================
-- View: pedidos com origem WhatsApp para o CRM
-- ============================================================

CREATE OR REPLACE VIEW vw_admin_whatsapp_orders AS
SELECT
  o.id,
  o.public_code,
  o.status,
  o.payment_status,
  o.fulfillment_type,
  o.subtotal_amount,
  o.shipping_amount,
  o.total_amount,
  o.occasion,
  o.desired_fulfillment_date,
  o.desired_fulfillment_period,
  o.recipient_name,
  o.is_gift,
  o.source_channel,
  o.source_conversation_id,
  o.created_at,
  c.full_name AS customer_name,
  c.phone_normalized AS customer_phone,
  cv.stage AS conversation_stage,
  cv.human_takeover
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN conversations cv ON cv.id = o.source_conversation_id
WHERE o.source_channel = 'whatsapp'
ORDER BY o.created_at DESC;

-- ============================================================
-- RPC: flor_admin_assume_conversation
-- Chamada pelo admin quando assume atendimento via CRM
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_admin_assume_conversation(
  p_conversation_id UUID,
  p_admin_id UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversations SET
    human_takeover = true,
    stage = 'human_takeover'::conversation_stage,
    context_json = COALESCE(context_json, '{}') || jsonb_build_object(
      'assumed_by_admin_id', p_admin_id,
      'assumed_at', now(),
      'admin_note', p_note
    ),
    updated_at = now()
  WHERE id = p_conversation_id;

  INSERT INTO agent_events (
    conversation_id, event_type, action, stage_after, payload_json
  )
  VALUES (
    p_conversation_id, 'admin_assumed', 'human_takeover', 'human_takeover',
    jsonb_build_object('admin_id', p_admin_id, 'note', p_note)
  );

  RETURN jsonb_build_object('ok', true, 'conversation_id', p_conversation_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- RPC: flor_admin_release_conversation
-- Libera conversa para o agente IA retomar
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_admin_release_conversation(
  p_conversation_id UUID,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversations SET
    human_takeover = false,
    stage = 'identificando_necessidade'::conversation_stage,
    context_json = COALESCE(context_json, '{}') || jsonb_build_object(
      'released_by_admin_id', p_admin_id,
      'released_at', now()
    ),
    updated_at = now()
  WHERE id = p_conversation_id;

  INSERT INTO agent_events (
    conversation_id, event_type, action, stage_after, payload_json
  )
  VALUES (
    p_conversation_id, 'admin_released', 'release_to_agent',
    'identificando_necessidade',
    jsonb_build_object('admin_id', p_admin_id)
  );

  RETURN jsonb_build_object('ok', true, 'conversation_id', p_conversation_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.flor_trigger_handoff IS 'Sprint 11: marca conversa como handoff e registra evento de auditoria.';
COMMENT ON FUNCTION public.flor_admin_assume_conversation IS 'Sprint 12: admin assume atendimento via CRM; bloqueia agente IA.';
COMMENT ON FUNCTION public.flor_admin_release_conversation IS 'Sprint 12: admin libera conversa para o agente IA retomar.';
COMMENT ON VIEW vw_admin_conversations IS 'Sprint 12: lista de conversas para o painel CRM do admin.';
COMMENT ON VIEW vw_admin_whatsapp_orders IS 'Sprint 12: pedidos originados via WhatsApp para o painel CRM.';
