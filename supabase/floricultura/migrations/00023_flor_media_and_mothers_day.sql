-- =============================================================================
-- 00023_flor_media_and_mothers_day.sql
--
-- Adds media processing columns to conversation_messages and
-- seeds Dia das Mães occasion tags on existing active products.
--
-- All statements are idempotent (IF NOT EXISTS / UPDATE with WHERE).
-- Apply after 00021 and 00022.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Media processing columns on conversation_messages
-- ---------------------------------------------------------------------------
ALTER TABLE conversation_messages
  ADD COLUMN IF NOT EXISTS transcription       TEXT,
  ADD COLUMN IF NOT EXISTS visual_description  TEXT;

COMMENT ON COLUMN conversation_messages.transcription
  IS 'OpenAI Whisper transcription of audio messages (Sprint 6A+)';

COMMENT ON COLUMN conversation_messages.visual_description
  IS 'OpenAI Vision description of image messages (Sprint 6A+)';

-- ---------------------------------------------------------------------------
-- 2. Ensure products table has occasion_tags column (may exist from 00014)
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS occasion_tags  TEXT[]  DEFAULT '{}';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS style_tags     TEXT[]  DEFAULT '{}';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_tags     TEXT[]  DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 3. Dia das Mães catalog boost
--    Tags ALL currently active products with dia_das_maes and presente
--    occasion tags so they surface in agent catalog searches.
--    Uses array_append pattern — idempotent (won't duplicate tags).
-- ---------------------------------------------------------------------------
UPDATE products
SET occasion_tags = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(occasion_tags, '{}') ||
      ARRAY['dia_das_maes', 'presente']
    )
  )
)
WHERE is_active = true
  AND NOT (occasion_tags @> ARRAY['dia_das_maes']);

-- ---------------------------------------------------------------------------
-- 4. Index for occasion_tags array search (used by search_ready_catalog_for_agent)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_occasion_tags
  ON products USING GIN (occasion_tags);

-- ---------------------------------------------------------------------------
-- 5. Agent settings row for Sprint 6A (idempotent)
--    Stores CATALOG_BASE_URL and other agent config in the settings table.
--    Update the value after deployment via Supabase dashboard or SQL.
-- ---------------------------------------------------------------------------
INSERT INTO settings (key, value, description)
VALUES
  ('agent_catalog_base_url',
   '"https://floricultura.vercel.app"',
   'Base URL for catalog links sent by the agent (product pages, order pages). Override after deploy.'),
  ('agent_mothers_day_active',
   'true',
   'When true, agent prioritizes Dia das Mães context in greetings and catalog searches.'),
  ('agent_handoff_phone',
   '""',
   'WhatsApp number for human handoff notifications (optional).')
ON CONFLICT (key) DO NOTHING;
