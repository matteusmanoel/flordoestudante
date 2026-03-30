-- GERADO — não editar. Fonte: seeds/01_*.sql + 02_*.sql + 03_*.sql. Rodar: pnpm db:floricultura:merge-seed
-- Seeds mínimas para desenvolvimento (floricultura)
-- Executar após as migrations. Admin é criado via Dashboard/API (ver manual-steps.md).

-- Settings (1 linha) — id fixo para upsert
INSERT INTO settings (
  id, store_name, brand_name, support_phone, support_email,
  pickup_enabled, delivery_enabled, currency_code, checkout_message
) VALUES (
  'c0000000-0000-4000-8000-000000000001',
  'Flor do Estudante',
  'Floricultura Flor do Estudante',
  '5511999999999',
  'contato@flordoestudante.com.br',
  true,
  true,
  'BRL',
  'Obrigado pelo seu pedido! Entraremos em contato em breve.'
) ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  brand_name = EXCLUDED.brand_name,
  support_phone = EXCLUDED.support_phone,
  support_email = EXCLUDED.support_email,
  updated_at = now();

-- Categorias (2)
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
  (gen_random_uuid(), 'Buquês', 'buques', 'Buquês e arranjos de flores', true, 0),
  (gen_random_uuid(), 'Presentes', 'presentes', 'Cestas e presentes especiais', true, 1)
ON CONFLICT (slug) DO NOTHING;

-- Produtos (4) - category_id e cover_image_url preenchidos após ter categorias
-- Usamos subquery para pegar o primeiro category_id
INSERT INTO products (
  category_id, name, slug, short_description, description, price, cover_image_url,
  is_active, is_featured, product_kind
)
SELECT c.id, 'Buquê Rosas Vermelhas', 'buque-rosas-vermelhas',
  'Buquê com 12 rosas vermelhas', 'Buquê elaborado com 12 rosas vermelhas frescas.', 89.90,
  '/img-box-svgrepo-com.svg', true, true, 'regular'
FROM categories c WHERE c.slug = 'buques' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  category_id, name, slug, short_description, description, price, cover_image_url,
  is_active, is_featured, product_kind
)
SELECT c.id, 'Buquê Misto', 'buque-misto',
  'Buquê com flores variadas', 'Buquê com flores da estação.', 69.90,
  '/img-box-svgrepo-com.svg', true, false, 'regular'
FROM categories c WHERE c.slug = 'buques' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  category_id, name, slug, short_description, description, price, cover_image_url,
  is_active, is_featured, product_kind
)
SELECT c.id, 'Cesta de Café da Manhã', 'cesta-cafe-manha',
  'Cesta para café da manhã especial', 'Cesta com frios, pães e bebidas.', 129.90,
  '/img-box-svgrepo-com.svg', true, true, 'regular'
FROM categories c WHERE c.slug = 'presentes' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  category_id, name, slug, short_description, description, price, cover_image_url,
  is_active, is_featured, product_kind
)
SELECT c.id, 'Vaso Orquídea', 'vaso-orquidea',
  'Orquídea em vaso decorativo', 'Orquídea phalaenopsis em vaso.', 149.90,
  '/img-box-svgrepo-com.svg', true, false, 'regular'
FROM categories c WHERE c.slug = 'presentes' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Imagens adicionais para o primeiro produto (opcional)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, '/img-box-svgrepo-com.svg', 'Detalhe do buquê', 1
FROM products p WHERE p.slug = 'buque-rosas-vermelhas' LIMIT 1;

-- Banners (2)
INSERT INTO banners (title, subtitle, image_url, cta_label, cta_href, is_active, sort_order) VALUES
  ('Novos buquês da temporada', 'Confira as novidades', '/placeholder-banner.jpg', 'Ver catálogo', '/categorias', true, 0),
  ('Entrega em até 24h', 'Na região metropolitana', '/placeholder-banner-2.jpg', 'Fazer pedido', '/', true, 1);

-- Regra de entrega (taxa fixa)
INSERT INTO shipping_rules (name, rule_type, amount, description, is_active, sort_order) VALUES
  ('Entrega padrão', 'fixed', 15.00, 'Taxa fixa para entrega na região', true, 0);

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

-- Seed: planos de assinatura, complementos e relações

-- Planos de assinatura
INSERT INTO subscription_plans (name, slug, short_description, description, cover_image_url, price, frequency, is_active, is_featured, sort_order) VALUES
  ('Flores da Semana', 'flores-da-semana', 'Arranjo fresco toda semana', 'Receba um arranjo exclusivo toda semana com flores da estação, preparado à mão pela nossa equipe.', '/img-box-svgrepo-com.svg', 79.90, 'weekly', true, true, 0),
  ('Quinzenal Especial', 'quinzenal-especial', 'Arranjo novo a cada 15 dias', 'A cada duas semanas, receba um arranjo cuidadosamente montado para decorar seu ambiente.', '/img-box-svgrepo-com.svg', 119.90, 'biweekly', true, false, 1),
  ('Flores do Mês', 'flores-do-mes', 'Arranjo premium todo mês', 'Arranjo mensal premium com flores selecionadas e embalagem especial.', '/img-box-svgrepo-com.svg', 159.90, 'monthly', true, true, 2)
ON CONFLICT (slug) DO NOTHING;

-- Complementos (add-ons)
INSERT INTO addons (name, slug, description, price, addon_category, is_active, sort_order) VALUES
  ('Caixa de Chocolates', 'caixa-chocolates', 'Caixa com 12 bombons artesanais', 39.90, 'chocolate', true, 0),
  ('Cartão Personalizado', 'cartao-personalizado', 'Cartão com mensagem escrita à mão', 9.90, 'card', true, 1),
  ('Vinho Tinto', 'vinho-tinto', 'Garrafa de vinho tinto selecionado', 69.90, 'drink', true, 2),
  ('Vela Aromática', 'vela-aromatica', 'Vela artesanal com aroma floral', 29.90, 'gift', true, 3),
  ('Urso de Pelúcia', 'urso-pelucia', 'Urso de pelúcia médio', 49.90, 'gift', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Vincular addons a produtos existentes (buquê rosas vermelhas)
INSERT INTO product_addons (product_id, addon_id, sort_order)
SELECT p.id, a.id, a.sort_order
FROM products p, addons a
WHERE p.slug = 'buque-rosas-vermelhas' AND a.is_active = true
ON CONFLICT (product_id, addon_id) DO NOTHING;

-- Vincular addons a todos os planos
INSERT INTO plan_addons (plan_id, addon_id, sort_order)
SELECT sp.id, a.id, a.sort_order
FROM subscription_plans sp, addons a
WHERE sp.is_active = true AND a.is_active = true
ON CONFLICT (plan_id, addon_id) DO NOTHING;
