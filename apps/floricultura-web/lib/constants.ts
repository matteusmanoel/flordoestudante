/**
 * Constantes locais do app floricultura-web.
 */

export const APP_NAME = 'Flor do Estudante';
export const APP_DESCRIPTION = 'Flores, buquês e presentes com entrega e retirada.';

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? 'Flor do Estudante';

/** Logo vetorial único servido em `/logo.svg` (apps/floricultura-web/public). */
export const BRAND_LOGO_SRC = '/logo.svg';
export const STORE_WHATSAPP = process.env.NEXT_PUBLIC_STORE_WHATSAPP ?? '5551999999999';

/** Placeholder para imagens de produtos/addons sem URL válida */
export const PLACEHOLDER_IMAGE = '/img-box-svgrepo-com.svg';

/**
 * True quando não há URL útil ou é o placeholder legado (evita renderizar SVG gigante como “foto”).
 * Importante: paths de Storage no formato `bucket/chave` não começam com `http` nem `/`, mas são válidos
 * após `resolvePublicImageUrl` — não tratá-los como “sem imagem” aqui.
 */
export function isPlaceholderMediaUrl(src: string | null | undefined): boolean {
  const s = (src ?? '').trim();
  if (!s) return true;
  if (s.includes('img-box-svgrepo-com')) return true;
  if (s.includes('placeholder-product')) return true;
  if (s === PLACEHOLDER_IMAGE) return true;
  if (s.startsWith('http://') || s.startsWith('https://')) return false;
  if (s.startsWith('/')) return false;
  if (s.includes('/')) return false;
  return true;
}

export const ROUTES = {
  home: '/',
  admin: '/admin',
  adminLogin: '/admin/login',
} as const;
