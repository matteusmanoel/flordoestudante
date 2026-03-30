-- Normaliza URLs absolutas do Supabase Storage para o formato persistido `bucket/path`,
-- compatível com resolvePublicImageUrl no app (portável entre ambientes/clientes).

UPDATE products
SET cover_image_url = regexp_replace(cover_image_url, '^https?://[^/]+/storage/v1/object/public/', '')
WHERE cover_image_url ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE product_images
SET image_url = regexp_replace(image_url, '^https?://[^/]+/storage/v1/object/public/', '')
WHERE image_url ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE banners
SET image_url = regexp_replace(image_url, '^https?://[^/]+/storage/v1/object/public/', '')
WHERE image_url ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE subscription_plans
SET cover_image_url = regexp_replace(cover_image_url, '^https?://[^/]+/storage/v1/object/public/', '')
WHERE cover_image_url ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE addons
SET cover_image_url = regexp_replace(cover_image_url, '^https?://[^/]+/storage/v1/object/public/', '')
WHERE cover_image_url ~ '^https?://[^/]+/storage/v1/object/public/';
