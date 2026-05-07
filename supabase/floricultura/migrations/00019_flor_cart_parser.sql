-- Sprint 9: RPC para parse de carrinho/pedido recebido via WhatsApp (Evolution orderMessage)

CREATE OR REPLACE FUNCTION public.flor_parse_whatsapp_cart(
  p_order_message_json JSONB,
  p_conversation_id UUID,
  p_customer_id UUID,
  p_similarity_threshold REAL DEFAULT 0.25
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_items_parsed JSONB := '[]'::JSONB;
  v_item_result JSONB;
  v_raw_name TEXT;
  v_raw_price NUMERIC;
  v_raw_quantity INT;
  v_product_id UUID;
  v_product_name TEXT;
  v_product_price NUMERIC;
  v_has_image BOOLEAN;
  v_match_score REAL;
  v_subtotal NUMERIC := 0;
  v_unmatched_count INT := 0;
  v_order_title TEXT;
  v_item_count INT;
  v_products_array JSONB;
  v_batch_id UUID;
BEGIN
  -- Extrair campos do orderMessage da Evolution
  v_order_title := COALESCE(p_order_message_json->>'orderTitle', 'Pedido WhatsApp');
  v_item_count := COALESCE((p_order_message_json->>'itemCount')::INT, 0);

  -- Tentar extrair array de produtos (estrutura pode variar por versão do Evolution)
  v_products_array := COALESCE(
    p_order_message_json->'products',
    p_order_message_json->'items',
    p_order_message_json->'orderItems',
    '[]'::JSONB
  );

  -- Criar batch de importação para revisão
  INSERT INTO catalog_import_batches (source, status, raw_payload_json, notes)
  VALUES ('whatsapp_cart', 'reviewing', p_order_message_json, v_order_title)
  RETURNING id INTO v_batch_id;

  -- Processar cada item do carrinho
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_products_array)
  LOOP
    v_raw_name := COALESCE(
      v_item->>'name', v_item->>'title',
      v_item->>'productName', 'Produto sem nome'
    );
    v_raw_price := COALESCE(
      (v_item->>'salePrice')::NUMERIC,
      (v_item->>'price')::NUMERIC,
      (v_item->>'unitPrice')::NUMERIC,
      0
    );
    v_raw_quantity := COALESCE(
      (v_item->>'quantity')::INT,
      (v_item->>'qty')::INT,
      1
    );

    -- Tentar match no catálogo
    SELECT m.id, m.name, m.price, m.has_image, m.match_score
    INTO v_product_id, v_product_name, v_product_price, v_has_image, v_match_score
    FROM match_catalog_item_for_agent(v_raw_name, v_raw_price, p_similarity_threshold)
      AS m(id, item_type, name, price, has_image, availability_status, match_score)
    ORDER BY m.match_score DESC
    LIMIT 1;

    -- Montar item resultado
    v_item_result := jsonb_build_object(
      'raw_name', v_raw_name,
      'raw_price', v_raw_price,
      'quantity', v_raw_quantity,
      'matched', v_product_id IS NOT NULL,
      'match_score', COALESCE(v_match_score, 0),
      'product_id', v_product_id,
      'product_name', COALESCE(v_product_name, v_raw_name),
      'unit_price', COALESCE(v_product_price, v_raw_price),
      'line_total', COALESCE(v_product_price, v_raw_price) * v_raw_quantity,
      'requires_human_review', v_product_id IS NULL OR v_match_score < 0.5
    );

    v_items_parsed := v_items_parsed || jsonb_build_array(v_item_result);
    v_subtotal := v_subtotal + COALESCE(v_product_price, v_raw_price) * v_raw_quantity;

    IF v_product_id IS NULL THEN
      v_unmatched_count := v_unmatched_count + 1;
    END IF;

    -- Registrar no batch
    INSERT INTO catalog_import_items (
      batch_id, item_type, matched_product_id, match_score,
      raw_name, raw_price, raw_quantity, raw_data_json,
      status
    )
    VALUES (
      v_batch_id, 'product', v_product_id, v_match_score,
      v_raw_name, v_raw_price, v_raw_quantity, v_item,
      CASE WHEN v_product_id IS NOT NULL THEN 'matched' ELSE 'unmatched' END
    );
  END LOOP;

  -- Registrar agent_event
  INSERT INTO agent_events (
    conversation_id, event_type, action, payload_json
  )
  VALUES (
    p_conversation_id, 'cart_received', 'parse_whatsapp_cart',
    jsonb_build_object(
      'batch_id', v_batch_id,
      'item_count', jsonb_array_length(v_items_parsed),
      'unmatched_count', v_unmatched_count,
      'subtotal', v_subtotal
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'batch_id', v_batch_id,
    'order_title', v_order_title,
    'items', v_items_parsed,
    'item_count', jsonb_array_length(v_items_parsed),
    'unmatched_count', v_unmatched_count,
    'subtotal', v_subtotal,
    'requires_human_review', v_unmatched_count > 0
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'items', '[]'::JSONB);
END;
$$;

COMMENT ON FUNCTION public.flor_parse_whatsapp_cart IS
  'Sprint 9: faz match dos itens do carrinho WhatsApp com o catálogo real. '
  'Itens sem match ficam pendentes para revisão humana.';
