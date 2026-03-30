-- Produtos recomendados (vinculação produto a similares para "Complete seu presente" / "Produtos que combinam")
CREATE TABLE product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(product_id, recommended_product_id),
  CHECK (product_id != recommended_product_id)
);

CREATE INDEX idx_product_recommendations_product ON product_recommendations(product_id);

ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_recommendations_select_public" ON product_recommendations FOR SELECT USING (true);
