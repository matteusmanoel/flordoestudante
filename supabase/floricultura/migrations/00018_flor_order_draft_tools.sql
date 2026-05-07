-- Sprint 8: RPCs para criação e atualização de pedidos rascunho via agente WhatsApp
-- Também relaxa constraints de orders para permitir status draft sem fulfillment_type definido

-- ============================================================
-- Ajuste de schema: fulfillment_type e payment_method opcionais para draft
-- ============================================================

-- Remover NOT NULL de fulfillment_type para pedidos draft
ALTER TABLE orders
  ALTER COLUMN fulfillment_type DROP NOT NULL;

-- Remover NOT NULL de payment_method para pedidos draft
ALTER TABLE orders
  ALTER COLUMN payment_method DROP NOT NULL;

-- Atualizar constraint de endereço: só exige address_snapshot_json se
-- fulfillment_type for 'delivery' E o pedido não for draft
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_delivery_address;

ALTER TABLE orders
  ADD CONSTRAINT orders_delivery_address CHECK (
    fulfillment_type IS NULL
    OR fulfillment_type != 'delivery'
    OR status = 'draft'
    OR address_snapshot_json IS NOT NULL
  );

-- ============================================================
-- Função auxiliar: gerar public_code único
-- ============================================================

CREATE OR REPLACE FUNCTION flor_generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'FLO-' || upper(substring(md5(random()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM orders WHERE public_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- ============================================================
-- RPC: flor_create_order_draft
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_create_order_draft(
  p_conversation_id UUID,
  p_customer_id UUID,
  p_items_json JSONB DEFAULT '[]'::JSONB,
  p_occasion TEXT DEFAULT NULL,
  p_desired_date DATE DEFAULT NULL,
  p_desired_period TEXT DEFAULT NULL,
  p_is_gift BOOLEAN DEFAULT false,
  p_surprise_delivery BOOLEAN DEFAULT false,
  p_gift_message TEXT DEFAULT NULL,
  p_recipient_name TEXT DEFAULT NULL,
  p_recipient_phone TEXT DEFAULT NULL,
  p_fulfillment_type TEXT DEFAULT NULL,
  p_address_snapshot_json JSONB DEFAULT NULL,
  p_customer_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_public_code TEXT;
  v_subtotal NUMERIC := 0;
  v_item JSONB;
  v_product_id UUID;
  v_item_name TEXT;
  v_unit_price NUMERIC;
  v_quantity INT;
  v_line_total NUMERIC;
BEGIN
  -- Gerar public_code
  v_public_code := flor_generate_order_code();

  -- Calcular subtotal dos itens
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_json)
  LOOP
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0);
    v_quantity := COALESCE((v_item->>'quantity')::INT, 1);
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  -- Criar pedido draft
  INSERT INTO orders (
    public_code,
    customer_id,
    status,
    payment_status,
    fulfillment_type,
    payment_method,
    subtotal_amount,
    shipping_amount,
    discount_amount,
    total_amount,
    source_channel,
    source_conversation_id,
    occasion,
    desired_fulfillment_date,
    desired_fulfillment_period,
    is_gift,
    surprise_delivery,
    gift_message,
    recipient_name,
    recipient_phone,
    address_snapshot_json,
    customer_note
  )
  VALUES (
    v_public_code,
    p_customer_id,
    'draft',
    'pending',
    CASE WHEN p_fulfillment_type IN ('delivery','pickup') THEN p_fulfillment_type::fulfillment_type ELSE NULL END,
    NULL,
    v_subtotal,
    0,
    0,
    v_subtotal,
    'whatsapp',
    p_conversation_id,
    p_occasion,
    p_desired_date,
    p_desired_period,
    COALESCE(p_is_gift, false),
    COALESCE(p_surprise_delivery, false),
    p_gift_message,
    p_recipient_name,
    p_recipient_phone,
    p_address_snapshot_json,
    p_customer_note
  )
  RETURNING id INTO v_order_id;

  -- Criar itens do pedido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_json)
  LOOP
    v_product_id := NULLIF((v_item->>'product_id')::TEXT, '')::UUID;
    v_item_name := COALESCE(v_item->>'product_name', v_item->>'name', 'Item sem nome');
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0);
    v_quantity := COALESCE((v_item->>'quantity')::INT, 1);
    v_line_total := v_unit_price * v_quantity;

    INSERT INTO order_items (
      order_id, product_id, product_name_snapshot,
      unit_price_snapshot, quantity, line_total,
      item_customization_json
    )
    VALUES (
      v_order_id, v_product_id, v_item_name,
      v_unit_price, v_quantity, v_line_total,
      v_item->'customization'
    );
  END LOOP;

  -- Atualizar conversation com o current_order_id
  UPDATE conversations
  SET current_order_id = v_order_id, updated_at = now()
  WHERE id = p_conversation_id;

  -- Registrar agent_event
  INSERT INTO agent_events (
    conversation_id, event_type, action, payload_json
  )
  VALUES (
    p_conversation_id, 'order_draft_created', 'create_order_draft',
    jsonb_build_object('order_id', v_order_id, 'public_code', v_public_code, 'subtotal', v_subtotal)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'public_code', v_public_code,
    'subtotal_amount', v_subtotal,
    'item_count', jsonb_array_length(p_items_json)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- RPC: flor_update_order_draft
-- ============================================================

CREATE OR REPLACE FUNCTION public.flor_update_order_draft(
  p_order_id UUID,
  p_patch_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_order_exists BOOLEAN;
  v_new_subtotal NUMERIC;
  v_new_total NUMERIC;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM orders WHERE id = p_order_id AND status = 'draft'
  ) INTO v_order_exists;

  IF NOT v_order_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido draft não encontrado: ' || p_order_id);
  END IF;

  -- Aplicar patch nos campos permitidos
  UPDATE orders SET
    occasion = COALESCE((p_patch_json->>'occasion'), occasion),
    desired_fulfillment_date = COALESCE(
      NULLIF(p_patch_json->>'desired_fulfillment_date','')::DATE,
      desired_fulfillment_date
    ),
    desired_fulfillment_period = COALESCE(
      NULLIF(p_patch_json->>'desired_fulfillment_period',''),
      desired_fulfillment_period
    ),
    fulfillment_type = COALESCE(
      CASE WHEN p_patch_json->>'fulfillment_type' IN ('delivery','pickup')
           THEN (p_patch_json->>'fulfillment_type')::fulfillment_type
           ELSE NULL END,
      fulfillment_type
    ),
    payment_method = COALESCE(
      CASE WHEN p_patch_json->>'payment_method' IN ('mercado_pago','pay_on_delivery','pay_on_pickup')
           THEN (p_patch_json->>'payment_method')::payment_method
           ELSE NULL END,
      payment_method
    ),
    recipient_name = COALESCE(NULLIF(p_patch_json->>'recipient_name',''), recipient_name),
    recipient_phone = COALESCE(NULLIF(p_patch_json->>'recipient_phone',''), recipient_phone),
    is_gift = COALESCE((p_patch_json->>'is_gift')::BOOLEAN, is_gift),
    surprise_delivery = COALESCE((p_patch_json->>'surprise_delivery')::BOOLEAN, surprise_delivery),
    gift_message = COALESCE(NULLIF(p_patch_json->>'gift_message',''), gift_message),
    customer_note = COALESCE(NULLIF(p_patch_json->>'customer_note',''), customer_note),
    internal_status_note = COALESCE(NULLIF(p_patch_json->>'internal_status_note',''), internal_status_note),
    address_snapshot_json = COALESCE(
      NULLIF(p_patch_json->'address_snapshot_json', 'null'::JSONB),
      address_snapshot_json
    ),
    shipping_amount = COALESCE(
      NULLIF((p_patch_json->>'shipping_amount')::NUMERIC, 0),
      shipping_amount
    ),
    updated_at = now()
  WHERE id = p_order_id;

  -- Recalcular total
  SELECT subtotal_amount + shipping_amount - discount_amount
  INTO v_new_total
  FROM orders WHERE id = p_order_id;

  UPDATE orders SET total_amount = v_new_total WHERE id = p_order_id;

  SELECT subtotal_amount INTO v_new_subtotal FROM orders WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', p_order_id,
    'subtotal_amount', v_new_subtotal,
    'total_amount', v_new_total
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.flor_create_order_draft IS 'Sprint 8: cria pedido rascunho via agente WhatsApp.';
COMMENT ON FUNCTION public.flor_update_order_draft IS 'Sprint 8: atualiza campos de pedido rascunho via agente (patch parcial).';
