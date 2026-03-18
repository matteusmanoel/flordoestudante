/**
 * Persistência local (localStorage) — helpers puros de leitura/escrita.
 * Apenas para ambiente browser; verificar typeof window antes de usar no SSR.
 */

export const STORAGE_KEYS = {
  CART: 'flor_cart',
  THEME: 'flor_theme',
} as const;

/**
 * Lê item do localStorage (retorna null se não existir ou em SSR).
 */
export function getLocalItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Grava item no localStorage (no-op em SSR).
 */
export function setLocalItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded ou storage desabilitado
  }
}

/**
 * Remove item do localStorage.
 */
export function removeLocalItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
