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
