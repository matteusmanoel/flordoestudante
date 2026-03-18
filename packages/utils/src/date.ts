/**
 * Utilitários de data/hora (funções puras).
 */

export type DateFormatOptions = {
  locale?: string;
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
};

const DEFAULT_LOCALE = 'pt-BR';

/**
 * Formata Date ou ISO string para data.
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (value == null) return '';
  const date = typeof value === 'object' && 'getTime' in value ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const { locale = DEFAULT_LOCALE, dateStyle = 'short' } = options;
  return new Intl.DateTimeFormat(locale, { dateStyle }).format(date);
}

/**
 * Formata Date ou ISO string para data e hora.
 */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (value == null) return '';
  const date = typeof value === 'object' && 'getTime' in value ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const { locale = DEFAULT_LOCALE, dateStyle = 'short', timeStyle = 'short' } = options;
  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(date);
}

/**
 * Parse de string ISO para Date (retorna null se inválido).
 */
export function parseISODate(value: string | null | undefined): Date | null {
  if (value == null || String(value).trim() === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Retorna se o valor é uma data válida.
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
