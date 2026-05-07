-- Sprint 1/2 backfill: campos de catálogo para o agente conversacional
-- Adiciona campos de busca, disponibilidade e tags em products

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_keywords TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'out_of_stock', 'made_to_order', 'seasonal')),
  ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS same_day_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS occasion_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS style_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS color_tags TEXT[] NOT NULL DEFAULT '{}';

-- Índice GIN para busca em arrays
CREATE INDEX IF NOT EXISTS idx_products_occasion_tags
  ON products USING GIN(occasion_tags);
CREATE INDEX IF NOT EXISTS idx_products_same_day
  ON products(same_day_available)
  WHERE same_day_available = true;
CREATE INDEX IF NOT EXISTS idx_products_availability_status
  ON products(availability_status);

-- Índice full-text em search_keywords
CREATE INDEX IF NOT EXISTS idx_products_search_keywords_fts
  ON products USING GIN(to_tsvector('portuguese', coalesce(search_keywords, '') || ' ' || name));

-- ============================================================
-- Campos adicionais em addons (idênticos para consistência)
-- ============================================================

ALTER TABLE addons
  ADD COLUMN IF NOT EXISTS search_keywords TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'out_of_stock', 'made_to_order', 'seasonal')),
  ADD COLUMN IF NOT EXISTS occasion_tags TEXT[] NOT NULL DEFAULT '{}';
