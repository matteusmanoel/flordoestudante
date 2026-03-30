/**
 * Upload de imagens para Supabase Storage.
 * Usa service role; chamar apenas do server (API route).
 */

import { createClient } from '@supabase/supabase-js';

const BUCKET_PRODUCTS = 'product-images';
const BUCKET_BANNERS = 'banner-images';
const BUCKET_PLANS = 'subscription-plan-images';
const BUCKET_ADDONS = 'addon-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type UploadResult = { url: string; path: string } | { error: string };

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function uploadProductImage(
  file: File,
  productId: string,
  index: number
): Promise<UploadResult> {
  const client = getStorageClient();
  if (!client) return { error: 'Supabase não configurado.' };

  if (file.size > MAX_SIZE_BYTES) return { error: 'Arquivo muito grande (máx 5MB).' };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Tipo de arquivo não permitido.' };

  const ext = file.name.split('.').pop() || 'jpg';
  const objectKey = `${productId}/${Date.now()}-${index}.${ext}`;

  const { error } = await client.storage.from(BUCKET_PRODUCTS).upload(objectKey, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) return { error: error.message };

  const { data } = client.storage.from(BUCKET_PRODUCTS).getPublicUrl(objectKey);
  return { url: data.publicUrl, path: `${BUCKET_PRODUCTS}/${objectKey}` };
}

export async function uploadBannerImage(file: File): Promise<UploadResult> {
  const client = getStorageClient();
  if (!client) return { error: 'Supabase não configurado.' };

  if (file.size > MAX_SIZE_BYTES) return { error: 'Arquivo muito grande (máx 5MB).' };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Tipo de arquivo não permitido.' };

  const ext = file.name.split('.').pop() || 'jpg';
  const objectKey = `banner-${Date.now()}.${ext}`;

  const { error } = await client.storage.from(BUCKET_BANNERS).upload(objectKey, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) return { error: error.message };

  const { data } = client.storage.from(BUCKET_BANNERS).getPublicUrl(objectKey);
  return { url: data.publicUrl, path: `${BUCKET_BANNERS}/${objectKey}` };
}

export async function uploadPlanImage(file: File, planId: string): Promise<UploadResult> {
  const client = getStorageClient();
  if (!client) return { error: 'Supabase não configurado.' };

  if (file.size > MAX_SIZE_BYTES) return { error: 'Arquivo muito grande (máx 5MB).' };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Tipo de arquivo não permitido.' };

  const ext = file.name.split('.').pop() || 'jpg';
  const objectKey = `plan-${planId}/${Date.now()}.${ext}`;

  const { error } = await client.storage.from(BUCKET_PLANS).upload(objectKey, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) return { error: error.message };

  const { data } = client.storage.from(BUCKET_PLANS).getPublicUrl(objectKey);
  return { url: data.publicUrl, path: `${BUCKET_PLANS}/${objectKey}` };
}

export async function uploadAddonImage(file: File, addonId: string): Promise<UploadResult> {
  const client = getStorageClient();
  if (!client) return { error: 'Supabase não configurado.' };

  if (file.size > MAX_SIZE_BYTES) return { error: 'Arquivo muito grande (máx 5MB).' };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Tipo de arquivo não permitido.' };

  const ext = file.name.split('.').pop() || 'jpg';
  const objectKey = `addon-${addonId}/${Date.now()}.${ext}`;

  const { error } = await client.storage.from(BUCKET_ADDONS).upload(objectKey, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) return { error: error.message };

  const { data } = client.storage.from(BUCKET_ADDONS).getPublicUrl(objectKey);
  return { url: data.publicUrl, path: `${BUCKET_ADDONS}/${objectKey}` };
}
