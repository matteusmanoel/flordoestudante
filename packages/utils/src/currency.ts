/**
 * Utilitários de formatação e parsing de moeda.
 */

export type CurrencyOptions = {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

const DEFAULT_LOCALE = 'pt-BR';
const DEFAULT_CURRENCY = 'BRL';

/**
 * Formata valor numérico como moeda.
 */
export function formatCurrency(
  value: number,
  options: CurrencyOptions = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formata valor como número (sem símbolo de moeda).
 */
export function formatNumber(
  value: number,
  options: { locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Converte string monetária (ex: "1.234,56") em número.
 */
export function parseCurrency(value: string | null | undefined): number {
  if (value == null || String(value).trim() === '') return 0;
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Arredonda valor para 2 casas decimais (evitar float).
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
