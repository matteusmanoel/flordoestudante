-- Sprint 2 backfill: views, funções e tabelas auxiliares do catálogo para o agente
-- Todas as views e funções usam CREATE OR REPLACE (idempotente)

-- ============================================================
-- Tabelas auxiliares
-- ============================================================

CREATE TABLE IF NOT EXISTS catalog_item_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'addon')),
  item_id UUID NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(alias)
);

CREATE INDEX IF NOT EXISTS idx_catalog_aliases_item
  ON catalog_item_aliases(item_id);

CREATE TABLE IF NOT EXISTS catalog_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'whatsapp_cart',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'published', 'discarded')),
  raw_payload_json JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'catalog_import_batches_updated_at') THEN
    CREATE TRIGGER catalog_import_batches_updated_at
      BEFORE UPDATE ON catalog_import_batches
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS catalog_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES catalog_import_batches(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'product'
    CHECK (item_type IN ('product', 'addon')),
  matched_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  matched_addon_id UUID REFERENCES addons(id) ON DELETE SET NULL,
  match_score SMALLINT DEFAULT 0,
  raw_name TEXT,
  raw_price DECIMAL(12,2),
  raw_quantity INT DEFAULT 1,
  raw_data_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'unmatched', 'published', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_import_items_batch
  ON catalog_import_items(batch_id);

-- ============================================================
-- View: catálogo unificado de products (para agente)
-- ============================================================

CREATE OR REPLACE VIEW vw_agent_catalog_products AS
SELECT
  p.id,
  'product'::TEXT AS item_type,
  p.name,
  p.slug,
  p.short_description,
  p.price,
  p.cover_image_url,
  CASE WHEN p.cover_image_url IS NOT NULL
       AND p.cover_image_url NOT LIKE '%placeholder%'
       AND trim(p.cover_image_url) != ''
    THEN true ELSE false
  END AS has_image,
  p.is_active,
  p.availability_status,
  p.requires_confirmation,
  p.same_day_available,
  p.occasion_tags,
  p.style_tags,
  p.color_tags,
  p.search_keywords,
  c.name AS category_name,
  c.slug AS category_slug
FROM products p
LEFT JOIN categories c ON c.id = p.category_id;

-- ============================================================
-- View: catálogo de addons (para agente)
-- ============================================================

CREATE OR REPLACE VIEW vw_agent_addons AS
SELECT
  a.id,
  'addon'::TEXT AS item_type,
  a.name,
  a.slug,
  a.description AS short_description,
  a.price,
  a.cover_image_url,
  CASE WHEN a.cover_image_url IS NOT NULL
       AND a.cover_image_url NOT LIKE '%placeholder%'
       AND trim(a.cover_image_url) != ''
    THEN true ELSE false
  END AS has_image,
  a.is_active,
  a.availability_status,
  false AS requires_confirmation,
  false AS same_day_available,
  a.occasion_tags,
  '{}'::TEXT[] AS style_tags,
  '{}'::TEXT[] AS color_tags,
  a.search_keywords,
  'complementos'::TEXT AS category_name,
  'complementos'::TEXT AS category_slug
FROM addons a;

-- ============================================================
-- View: catálogo unificado (products + addons)
-- ============================================================

CREATE OR REPLACE VIEW vw_agent_catalog_items AS
SELECT * FROM vw_agent_catalog_products
UNION ALL
SELECT * FROM vw_agent_addons;

-- ============================================================
-- View: prontidão do catálogo (diagnóstico)
-- ============================================================

CREATE OR REPLACE VIEW vw_agent_catalog_readiness AS
SELECT
  item_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active) AS active,
  COUNT(*) FILTER (WHERE is_active AND has_image) AS active_with_image,
  COUNT(*) FILTER (WHERE is_active AND NOT has_image) AS active_text_only,
  COUNT(*) FILTER (WHERE is_active AND availability_status = 'available') AS available,
  COUNT(*) FILTER (WHERE is_active AND same_day_available) AS same_day
FROM vw_agent_catalog_items
GROUP BY item_type;

-- ============================================================
-- Função: busca completa no catálogo (inclui inativos)
-- ============================================================

CREATE OR REPLACE FUNCTION search_full_catalog_for_agent(
  p_query TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_occasion TEXT DEFAULT NULL,
  p_max_budget NUMERIC DEFAULT NULL,
  p_item_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  name TEXT,
  slug TEXT,
  short_description TEXT,
  price NUMERIC,
  cover_image_url TEXT,
  has_image BOOLEAN,
  is_active BOOLEAN,
  availability_status TEXT,
  requires_confirmation BOOLEAN,
  same_day_available BOOLEAN,
  occasion_tags TEXT[],
  category_name TEXT,
  search_keywords TEXT,
  rank REAL
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.item_type,
    i.name,
    i.slug,
    i.short_description,
    i.price::NUMERIC,
    i.cover_image_url,
    i.has_image,
    i.is_active,
    i.availability_status,
    i.requires_confirmation,
    i.same_day_available,
    i.occasion_tags,
    i.category_name,
    i.search_keywords,
    ts_rank(
      to_tsvector('portuguese',
        coalesce(i.name,'') || ' ' ||
        coalesce(i.short_description,'') || ' ' ||
        coalesce(i.search_keywords,'') || ' ' ||
        coalesce(i.category_name,'') || ' ' ||
        array_to_string(i.occasion_tags, ' ')
      ),
      plainto_tsquery('portuguese', coalesce(p_query,''))
    ) AS rank
  FROM vw_agent_catalog_items i
  WHERE
    (p_item_type IS NULL OR i.item_type = p_item_type)
    AND (p_max_budget IS NULL OR i.price <= p_max_budget)
    AND (p_category IS NULL OR i.category_slug ILIKE '%' || p_category || '%'
                            OR i.category_name ILIKE '%' || p_category || '%')
    AND (p_occasion IS NULL OR p_occasion = ANY(i.occasion_tags))
    AND (
      p_query IS NULL
      OR i.name ILIKE '%' || p_query || '%'
      OR i.short_description ILIKE '%' || p_query || '%'
      OR i.search_keywords ILIKE '%' || p_query || '%'
      OR i.category_name ILIKE '%' || p_query || '%'
      OR to_tsvector('portuguese',
           coalesce(i.name,'') || ' ' ||
           coalesce(i.short_description,'') || ' ' ||
           coalesce(i.search_keywords,'')
         ) @@ plainto_tsquery('portuguese', p_query)
    )
  ORDER BY
    CASE WHEN i.availability_status = 'available' THEN 0 ELSE 1 END,
    i.same_day_available DESC,
    i.has_image DESC,
    rank DESC,
    i.price ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- Função: busca apenas itens prontos/disponíveis (uso do agente em produção)
-- ============================================================

CREATE OR REPLACE FUNCTION search_ready_catalog_for_agent(
  p_query TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_occasion TEXT DEFAULT NULL,
  p_max_budget NUMERIC DEFAULT NULL,
  p_same_day_only BOOLEAN DEFAULT false,
  p_item_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  name TEXT,
  slug TEXT,
  short_description TEXT,
  price NUMERIC,
  cover_image_url TEXT,
  has_image BOOLEAN,
  availability_status TEXT,
  requires_confirmation BOOLEAN,
  same_day_available BOOLEAN,
  occasion_tags TEXT[],
  category_name TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.item_type,
    i.name,
    i.slug,
    i.short_description,
    i.price::NUMERIC,
    i.cover_image_url,
    i.has_image,
    i.availability_status,
    i.requires_confirmation,
    i.same_day_available,
    i.occasion_tags,
    i.category_name
  FROM vw_agent_catalog_items i
  WHERE
    i.is_active = true
    AND i.availability_status IN ('available', 'made_to_order')
    AND (p_same_day_only = false OR i.same_day_available = true)
    AND (p_item_type IS NULL OR i.item_type = p_item_type)
    AND (p_max_budget IS NULL OR i.price <= p_max_budget)
    AND (p_category IS NULL
         OR i.category_slug ILIKE '%' || p_category || '%'
         OR i.category_name ILIKE '%' || p_category || '%')
    AND (p_occasion IS NULL OR p_occasion = ANY(i.occasion_tags))
    AND (
      p_query IS NULL
      OR i.name ILIKE '%' || p_query || '%'
      OR i.short_description ILIKE '%' || p_query || '%'
      OR i.search_keywords ILIKE '%' || p_query || '%'
      OR i.category_name ILIKE '%' || p_query || '%'
    )
  ORDER BY
    i.has_image DESC,
    i.same_day_available DESC,
    CASE WHEN i.availability_status = 'available' THEN 0 ELSE 1 END,
    i.price ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- Função: match de item do catálogo por nome (para parse de carrinho)
-- ============================================================

CREATE OR REPLACE FUNCTION match_catalog_item_for_agent(
  p_raw_name TEXT,
  p_raw_price NUMERIC DEFAULT NULL,
  p_similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  name TEXT,
  price NUMERIC,
  has_image BOOLEAN,
  availability_status TEXT,
  match_score REAL
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.item_type,
    i.name,
    i.price::NUMERIC,
    i.has_image,
    i.availability_status,
    (
      similarity(lower(i.name), lower(p_raw_name)) * 0.6
      + CASE WHEN p_raw_price IS NOT NULL AND abs(i.price - p_raw_price) < 5 THEN 0.4 ELSE 0 END
    ) AS match_score
  FROM vw_agent_catalog_items i
  WHERE
    i.is_active = true
    AND (
      similarity(lower(i.name), lower(p_raw_name)) >= p_similarity_threshold
      OR i.name ILIKE '%' || p_raw_name || '%'
      OR p_raw_name ILIKE '%' || i.name || '%'
    )
  ORDER BY match_score DESC
  LIMIT 3;
END;
$$;

-- Extensão pg_trgm necessária para similarity()
CREATE EXTENSION IF NOT EXISTS pg_trgm;
