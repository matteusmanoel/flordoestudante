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
