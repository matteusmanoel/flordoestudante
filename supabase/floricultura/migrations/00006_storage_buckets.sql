-- Buckets de storage para imagens (floricultura)
-- Convenção: product-images (produtos), banner-images (banners), brand-assets (logo etc.)
-- Leitura pública para exibir no catálogo; upload restrito a admin/service (políticas via Dashboard ou migration futura)

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('banner-images', 'banner-images', true),
  ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas básicas: leitura pública para todos os buckets (arquivos são públicos)
-- Upload/delete ficam para service role ou políticas adicionais no Dashboard
-- Ref: https://supabase.com/docs/guides/storage/security/access-control
