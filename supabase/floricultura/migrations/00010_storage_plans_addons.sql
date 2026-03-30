-- Buckets para imagens de planos e complementos (admin upload via service role)

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('subscription-plan-images', 'subscription-plan-images', true),
  ('addon-images', 'addon-images', true)
ON CONFLICT (id) DO NOTHING;
