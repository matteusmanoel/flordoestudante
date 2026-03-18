-- Cliente e pedido de exemplo para desenvolvimento (floricultura)
-- Depende de categorias, products e shipping_rules existirem

-- Cliente de teste
INSERT INTO customers (id, full_name, phone, email)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Cliente Teste',
  '55119888887777',
  'teste@exemplo.com'
) ON CONFLICT (id) DO NOTHING;

-- Pedido de exemplo (rascunho) — address_snapshot_json obrigatório para delivery
INSERT INTO orders (
  id, public_code, customer_id, status, payment_status, fulfillment_type,
  shipping_rule_id, shipping_amount, subtotal_amount, discount_amount, total_amount,
  payment_method, customer_note, address_snapshot_json
)
SELECT
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'FD-2024-0001',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'draft',
  'pending',
  'delivery',
  sr.id,
  15.00,
  89.90,
  0,
  104.90,
  'mercado_pago',
  'Pedido de teste para desenvolvimento',
  '{"recipient_name":"Cliente Teste","street":"Rua Exemplo","number":"100","complement":null,"neighborhood":"Centro","city":"São Paulo","state":"SP","postal_code":"01000-000"}'::jsonb
FROM shipping_rules sr LIMIT 1
ON CONFLICT (public_code) DO NOTHING;

-- Item do pedido (referência ao primeiro produto) — só insere se o pedido existir e ainda não tiver itens
INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total)
SELECT
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  p.id,
  p.name,
  p.price,
  1,
  p.price
FROM products p
WHERE p.slug = 'buque-rosas-vermelhas'
  AND EXISTS (SELECT 1 FROM orders o WHERE o.public_code = 'FD-2024-0001')
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22')
LIMIT 1;
