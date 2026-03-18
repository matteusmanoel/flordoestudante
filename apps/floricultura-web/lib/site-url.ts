/**
 * URL pública base do app (Mercado Pago notification_url, back_urls, links).
 * Ordem: NEXT_PUBLIC_SITE_URL → https://VERCEL_URL (preview/prod Vercel) → localhost.
 */

export function getPublicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, '')}`;
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[site-url] Produção sem NEXT_PUBLIC_SITE_URL nem VERCEL_URL — usando localhost; defina NEXT_PUBLIC_SITE_URL para Mercado Pago e links públicos.'
    );
  }
  return 'http://localhost:3000';
}
