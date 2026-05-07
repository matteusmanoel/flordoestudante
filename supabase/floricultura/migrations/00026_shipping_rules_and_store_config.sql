-- ============================================================
-- 00026: Regras de entrega Capitão Leônidas Marques + config PIX
-- ============================================================
-- Ajusta taxa de entrega para R$20,00 e restringe área ao
-- município de Capitão Leônidas Marques (PR, 85790-000).
-- Adiciona coluna extra_metadata em settings para chave PIX.
-- shipping_rule_type no MVP é apenas 'fixed' (ver 00001_enums.sql).
-- ============================================================

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS extra_metadata JSONB DEFAULT '{}';

INSERT INTO shipping_rules (
  name,
  rule_type,
  amount,
  is_active,
  metadata_json
)
SELECT
  'Entrega local — Capitão Leônidas Marques',
  'fixed'::shipping_rule_type,
  20.00,
  true,
  jsonb_build_object(
    'allowed_cities', ARRAY['Capitão Leônidas Marques', 'Capitao Leonidas Marques'],
    'allowed_states', ARRAY['PR'],
    'allowed_postal_codes_prefix', ARRAY['85790'],
    'store_city', 'Capitão Leônidas Marques',
    'store_state', 'PR',
    'store_postal_code', '85790-000',
    'store_address', 'R. Demetrio Paulo Paini, 167 - Cap. Leônidas Marques, PR, 85790-000',
    'note', 'Taxa fixa — configuração de taxa por bairro prevista para sprint futuro.'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_rules sr
  WHERE sr.name = 'Entrega local — Capitão Leônidas Marques'
);

UPDATE shipping_rules
SET
  amount = 20.00,
  is_active = true,
  metadata_json = jsonb_build_object(
    'allowed_cities', ARRAY['Capitão Leônidas Marques', 'Capitao Leonidas Marques'],
    'allowed_states', ARRAY['PR'],
    'allowed_postal_codes_prefix', ARRAY['85790'],
    'store_city', 'Capitão Leônidas Marques',
    'store_state', 'PR',
    'store_postal_code', '85790-000',
    'store_address', 'R. Demetrio Paulo Paini, 167 - Cap. Leônidas Marques, PR, 85790-000',
    'note', 'Taxa fixa — configuração de taxa por bairro prevista para sprint futuro.'
  ),
  updated_at = now()
WHERE
  rule_type = 'fixed'
  AND lower(name) LIKE '%capit%'
  AND id NOT IN (
    SELECT id FROM shipping_rules
    WHERE name = 'Entrega local — Capitão Leônidas Marques'
    ORDER BY created_at
    LIMIT 1
  );
