-- ============================================================
-- 00026: Regras de entrega Capitão Leônidas Marques + config PIX
-- ============================================================
-- Ajusta taxa de entrega para R$20,00 e restringe área ao
-- município de Capitão Leônidas Marques (PR, 85790-000).
-- Adiciona coluna extra_metadata em settings para chave PIX.
-- ============================================================

-- 1. Coluna extra_metadata em settings (caso não exista)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS extra_metadata JSONB DEFAULT '{}';

-- 2. Upsert regra de entrega padrão
--    Se já existe uma linha, atualiza; caso não exista, insere.
INSERT INTO shipping_rules (
  name,
  rule_type,
  amount,
  is_active,
  metadata_json
)
VALUES (
  'Entrega local — Capitão Leônidas Marques',
  'flat',
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
)
ON CONFLICT DO NOTHING;

-- Se já existia uma linha com nome similar, atualiza o valor e o metadata
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
  rule_type IN ('flat', 'fixed', 'delivery')
  AND lower(name) LIKE '%capit%'
  AND id != (
    SELECT id FROM shipping_rules
    WHERE name = 'Entrega local — Capitão Leônidas Marques'
    ORDER BY created_at
    LIMIT 1
  );
