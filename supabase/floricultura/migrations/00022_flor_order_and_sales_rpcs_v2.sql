-- =============================================================================
-- 00022_flor_order_and_sales_rpcs_v2.sql
--
-- Order management and autonomous sales RPCs for Sprint 6A.
-- Corrected to use real production schema columns.
-- Includes flor_prepare_checkout with full checkout URL generation.
--
-- Routes confirmed in repo:
--   /pedido/[codigo]           → app/(public)/pedido/[codigo]/page.tsx
--   /pedido/[codigo]/pagamento → app/(public)/pedido/[codigo]/pagamento/page.tsx
--   /produto/[slug]            → app/(public)/produto/[slug]/page.tsx
--
-- Apply after 00021. Do NOT apply 00013-00020 to the current production DB.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. flor_create_order_draft
--    Creates a new draft order with initial items. Returns order_id and
--    public_code so the agent can reference the order in subsequent turns.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_create_order_draft(
  p_customer_id         UUID,
  p_conversation_id     UUID,
  p_fulfillment_type    TEXT          DEFAULT 'pickup',   -- 'pickup' | 'delivery'
  p_occasion            TEXT          DEFAULT NULL,       -- e.g. 'dia_das_maes'
  p_items               JSONB         DEFAULT '[]'::JSONB,
  -- each item: {product_id, product_name, unit_price, quantity}
  p_recipient_name      TEXT          DEFAULT NULL,
  p_is_gift             BOOLEAN       DEFAULT false,
  p_gift_message        TEXT          DEFAULT NULL,
  p_desired_date        DATE          DEFAULT NULL,
  p_desired_period      TEXT          DEFAULT NULL,       -- 'morning' | 'afternoon' | 'evening'
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
  -- Generate public code (8 char uppercase alphanumeric)
  v_public_code := upper(substring(replace(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8));

  -- Calculate subtotal from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_line_total := (v_item->>'unit_price')::NUMERIC * (v_item->>'quantity')::INT;
    v_subtotal   := v_subtotal + v_line_total;
  END LOOP;

  -- Lookup shipping rule for delivery (use first active rule or 0 for pickup)
  IF p_fulfillment_type = 'delivery' THEN
    SELECT COALESCE(fixed_amount, 0)
    INTO   v_shipping
    FROM   shipping_rules
    WHERE  is_active = true
    ORDER  BY created_at DESC
    LIMIT  1;
    v_shipping := COALESCE(v_shipping, 0);
  END IF;

  -- Create order
  INSERT INTO orders (
    customer_id, conversation_id, public_code, status,
    fulfillment_type, occasion,
    subtotal_amount, shipping_amount, total_amount,
    recipient_name, is_gift, gift_message,
    desired_fulfillment_date, desired_fulfillment_period,
    notes
  )
  VALUES (
    p_customer_id, p_conversation_id, v_public_code, 'draft',
    p_fulfillment_type::fulfillment_type, p_occasion,
    v_subtotal, v_shipping, v_subtotal + v_shipping,
    NULLIF(p_recipient_name, ''), p_is_gift, NULLIF(p_gift_message, ''),
    p_desired_date, p_desired_period,
    NULLIF(p_notes, '')
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
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

  -- Link conversation to order
  UPDATE conversations SET
    current_order_id = v_order_id,
    updated_at       = now()
  WHERE id = p_conversation_id;

  RETURN jsonb_build_object(
    'ok',           true,
    'order_id',     v_order_id,
    'public_code',  v_public_code,
    'subtotal',     v_subtotal,
    'shipping',     v_shipping,
    'total',        v_subtotal + v_shipping
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. flor_update_order_draft
--    Updates fulfillment/recipient/gift/delivery info on an existing draft.
--    Also supports appending new items or replacing the item list.
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
  p_add_items             JSONB   DEFAULT NULL,   -- append new items
  p_replace_items         JSONB   DEFAULT NULL,   -- replace entire item list
  p_delivery_address_json JSONB   DEFAULT NULL    -- {street, city, zip, complement}
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

  -- Replace items if requested
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

  -- Append items if requested
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

  -- Recalculate subtotal
  SELECT COALESCE(sum(line_total), 0) INTO v_subtotal
  FROM order_items WHERE order_id = p_order_id;

  -- Recalculate shipping for delivery
  IF COALESCE(p_fulfillment_type, v_order.fulfillment_type::TEXT) = 'delivery' THEN
    SELECT COALESCE(fixed_amount, 0) INTO v_shipping
    FROM shipping_rules WHERE is_active = true ORDER BY created_at DESC LIMIT 1;
    v_shipping := COALESCE(v_shipping, 0);
  END IF;

  -- Update order fields
  UPDATE orders SET
    fulfillment_type         = COALESCE(p_fulfillment_type::fulfillment_type, fulfillment_type),
    recipient_name           = CASE WHEN p_recipient_name IS NOT NULL THEN NULLIF(p_recipient_name, '') ELSE recipient_name END,
    is_gift                  = COALESCE(p_is_gift, is_gift),
    gift_message             = CASE WHEN p_gift_message IS NOT NULL THEN NULLIF(p_gift_message, '') ELSE gift_message END,
    occasion                 = COALESCE(NULLIF(p_occasion, ''), occasion),
    desired_fulfillment_date = COALESCE(p_desired_date, desired_fulfillment_date),
    desired_fulfillment_period = COALESCE(NULLIF(p_desired_period, ''), desired_fulfillment_period),
    notes                    = CASE WHEN p_notes IS NOT NULL THEN NULLIF(p_notes, '') ELSE notes END,
    subtotal_amount          = v_subtotal,
    shipping_amount          = v_shipping,
    total_amount             = v_subtotal + v_shipping,
    updated_at               = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok',        true,
    'order_id',  p_order_id,
    'subtotal',  v_subtotal,
    'shipping',  v_shipping,
    'total',     v_subtotal + v_shipping
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. flor_prepare_checkout
--    Advances a draft order to pending_payment status.
--    Returns checkout URL for /pedido/{code}/pagamento route.
--    Also builds a human-readable order summary for the agent reply.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flor_prepare_checkout(
  p_order_id       UUID,
  p_payment_method TEXT    DEFAULT NULL,  -- 'mercado_pago' | 'pay_on_delivery' | 'pay_on_pickup'
  p_catalog_base_url TEXT  DEFAULT NULL   -- e.g. https://floricultura.com.br (passed from workflow)
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
      'ok', false,
      'error', 'Order is not in draft status: ' || v_order.status,
      'public_code', v_order.public_code
    );
  END IF;

  -- Update to pending_payment
  UPDATE orders SET
    status         = 'pending_payment',
    payment_method = CASE
                       WHEN p_payment_method IN ('mercado_pago','pay_on_delivery','pay_on_pickup')
                       THEN p_payment_method::payment_method
                       ELSE payment_method
                     END,
    updated_at = now()
  WHERE id = p_order_id;

  -- Build items summary text
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

  -- Build URLs
  v_order_url := COALESCE(NULLIF(p_catalog_base_url, ''), 'https://floricultura.vercel.app')
                 || '/pedido/' || v_order.public_code;
  v_pay_url   := v_order_url || '/pagamento';

  RETURN jsonb_build_object(
    'ok',                true,
    'order_id',          p_order_id,
    'public_code',       v_order.public_code,
    'total_amount',      v_order.total_amount,
    'fulfillment_type',  v_order.fulfillment_type,
    'payment_method',    COALESCE(p_payment_method, v_order.payment_method::TEXT),
    'order_summary_text',v_summary,
    'order_url',         v_order_url,
    'checkout_url',      v_pay_url
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. flor_parse_whatsapp_cart
--    Parses a WhatsApp native cart message and maps items against the catalog.
--    Fixed to use real catalog_import_items / catalog_import_batches columns.
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
  v_batch_id   UUID;
  v_cart_item  JSONB;
  v_product_id UUID;
  v_match_score INT := 0;
  v_results    JSONB := '[]'::JSONB;
  v_item_name  TEXT;
  v_item_price NUMERIC;
  v_item_qty   INT;
BEGIN
  -- Create import batch to track this cart parse
  INSERT INTO catalog_import_batches (source, source_label, status, raw_payload_json, notes)
  VALUES ('whatsapp_cart', 'WhatsApp Cart - ' || p_phone_normalized, 'reviewing', p_cart_payload,
          'Auto-parsed by agent Sprint 6A')
  RETURNING id INTO v_batch_id;

  -- Process each cart item
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(
    COALESCE(p_cart_payload->'order'->'items', p_cart_payload->'items', '[]'::JSONB)
  ) LOOP
    v_item_name  := COALESCE(v_cart_item->>'title', v_cart_item->>'name', '');
    v_item_price := COALESCE(NULLIF(v_cart_item->>'price', '')::NUMERIC, 0) / 1000.0;  -- WA prices in milli
    v_item_qty   := COALESCE(NULLIF(v_cart_item->>'quantity', '')::INT, 1);

    -- Try to find product match by name similarity
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

    -- Insert import item with real column names
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

    -- Accumulate results
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
    'ok',        true,
    'batch_id',  v_batch_id,
    'item_count',jsonb_array_length(v_results),
    'items',     v_results
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. flor_trigger_handoff
--    Marks a conversation for human takeover and logs the event.
--    Fixed to use metadata_json (not context_json).
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
  UPDATE conversations SET
    human_takeover = true,
    status         = 'waiting_human',
    metadata_json  = COALESCE(metadata_json, '{}'::JSONB) || jsonb_build_object(
      'handoff_reason',    p_reason,
      'handoff_note',      p_agent_note,
      'handoff_at',        now()
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
    jsonb_build_object('human_takeover', true)
  );

  RETURN jsonb_build_object('ok', true, 'reason', p_reason);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.flor_create_order_draft(UUID,UUID,TEXT,TEXT,JSONB,TEXT,BOOLEAN,TEXT,DATE,TEXT,TEXT)              TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.flor_update_order_draft(UUID,TEXT,TEXT,BOOLEAN,TEXT,TEXT,DATE,TEXT,TEXT,JSONB,JSONB,JSONB)        TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.flor_prepare_checkout(UUID, TEXT, TEXT)                                                           TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.flor_parse_whatsapp_cart(TEXT, JSONB)                                                            TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.flor_trigger_handoff(UUID, TEXT, TEXT, UUID)                                                     TO authenticated, anon, service_role;
