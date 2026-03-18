/**
 * Utilitários puros de string.
 */

/**
 * Gera slug a partir de texto (acentos removidos, minúsculo, hífens).
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Trunca texto com reticências.
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Primeira letra em maiúscula.
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Remove espaços extras e trim.
 */
export function normalizeSpaces(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Verifica se string está vazia ou só espaços.
 */
export function isBlank(value: string | null | undefined): boolean {
  return value == null || String(value).trim() === '';
}

/**
 * Retorna string ou valor padrão se em branco.
 */
export function orDefault(value: string | null | undefined, defaultValue: string): string {
  return isBlank(value) ? defaultValue : String(value).trim();
}
