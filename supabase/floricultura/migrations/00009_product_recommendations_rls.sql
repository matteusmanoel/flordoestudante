-- RLS para product_recommendations: leitura pública (para catálogo)
-- Idempotente: garante que a policy existe mesmo que 00008 não tenha sido aplicada
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_recommendations_select_public" ON product_recommendations;
CREATE POLICY "product_recommendations_select_public"
  ON product_recommendations FOR SELECT USING (true);
