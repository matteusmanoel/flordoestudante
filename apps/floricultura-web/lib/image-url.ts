/**
 * Normaliza URLs de mídia: Storage do Supabase (path `bucket/key`), URLs absolutas do mesmo Storage
 * (reescreve com NEXT_PUBLIC_SUPABASE_URL atual), paths relativos ao app (/...) e URLs externas.
 */

import { PLACEHOLDER_IMAGE } from '@/lib/constants';

const STORAGE_PUBLIC_MARKER = '/storage/v1/object/public/';

/** Extrai `bucket/path...` de uma URL pública do Storage, ou null. */
export function extractSupabaseStoragePublicPath(url: string): string | null {
  const idx = url.indexOf(STORAGE_PUBLIC_MARKER);
  if (idx === -1) return null;
  const path = url.slice(idx + STORAGE_PUBLIC_MARKER.length).split('?')[0] ?? '';
  return path.trim() || null;
}

function buildPublicUrlFromBucketPath(bucketPath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
  if (!base) return bucketPath;
  return `${base}${STORAGE_PUBLIC_MARKER}${bucketPath}`;
}

/**
 * Resolve valor salvo no banco ou vindo do upload para URL absoluta utilizável em `<img>` / `next/image`.
 * Cobre: URL https completa, path só com `/storage/v1/object/public/...`, `bucket/key`, `//host/...`,
 * e arquivos estáticos do app (`/logo.svg`, placeholders).
 */
export function resolvePublicImageUrl(raw: string | null | undefined): string {
  const s = (raw ?? '').trim();
  if (!s) return '';

  /** Seeds antigos apontavam para JPG inexistente na pasta public → placeholder único. */
  if (s.includes('placeholder-product')) {
    return PLACEHOLDER_IMAGE;
  }

  // Tratar casos de URLs mal formadas ou incompletas
  if (s === 'null' || s === 'undefined') {
    return '';
  }

  if (s.startsWith('//')) {
    return `https:${s}`;
  }

  if (s.startsWith('http://') || s.startsWith('https://')) {
    const extracted = extractSupabaseStoragePublicPath(s);
    if (extracted) return buildPublicUrlFromBucketPath(extracted);
    return s;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';

  /** Path público do Storage gravado sem domínio (comum em imports/seeds). */
  if (s.startsWith(STORAGE_PUBLIC_MARKER)) {
    if (!base) return s;
    return `${base}${s}`;
  }

  /** Demais paths absolutos no app (não são Storage remoto). */
  if (s.startsWith('/')) return s;

  if (s.includes('/')) {
    return buildPublicUrlFromBucketPath(s);
  }

  return s;
}
