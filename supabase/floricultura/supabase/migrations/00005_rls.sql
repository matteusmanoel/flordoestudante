-- RLS: fundação para autorização do painel admin (floricultura)
-- Catálogo e settings públicos (leitura); demais tabelas restritas a admin ou service role

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports_log ENABLE ROW LEVEL SECURITY;

-- Função: verificar se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas: leitura pública para catálogo e configuração
CREATE POLICY "settings_select_public" ON settings FOR SELECT USING (true);
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "products_select_public" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "product_images_select_public" ON product_images FOR SELECT USING (true);
CREATE POLICY "banners_select_public" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "shipping_rules_select_public" ON shipping_rules FOR SELECT USING (is_active = true);

-- Admins: só o próprio perfil em leitura; escrita via service role ou trigger pós-signup
CREATE POLICY "admins_select_own" ON admins FOR SELECT USING (auth_user_id = auth.uid());

-- Demais tabelas: sem política para anon/authenticated por padrão (apenas service_role)
-- O app usará service role no backend para operações admin e criação de pedidos.
-- Para o MVP, leitura/escrita de customers, orders, etc. será feita por API routes com service role.
-- Se no futuro o client precisar de leitura anônima limitada (ex: order status por public_code),
-- adicionar política específica.

-- Resumo: anon pode ler settings, categories, products, product_images, banners, shipping_rules.
-- Authenticated admin pode ler sua linha em admins. Restante via service role.
COMMENT ON FUNCTION public.current_user_is_admin() IS 'Usado pelo painel admin para checar se o usuário logado está em admins e está ativo';
