/**
 * Utilitários de telefone (BR e internacional básico).
 */

/**
 * Remove tudo que não for dígito.
 */
export function digitsOnly(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value).replace(/\D/g, '');
}

/**
 * Normaliza telefone BR: 10 ou 11 dígitos (DDD + número).
 */
export function normalizePhoneBR(value: string | null | undefined): string {
  const d = digitsOnly(value);
  if (d.length >= 10 && d.length <= 11) return d;
  if (d.length > 11) return d.slice(-11);
  return d;
}

/**
 * Formata telefone BR para exibição: (11) 98765-4321.
 */
export function formatPhoneBR(value: string | null | undefined): string {
  const d = digitsOnly(value);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/**
 * Retorna número no formato E.164 simplificado para Brasil (+55...).
 */
export function toE164BR(value: string | null | undefined): string {
  const d = digitsOnly(value);
  if (d.length < 10) return '';
  const full = d.length === 11 ? d : (d.length === 10 ? '9' + d : d.slice(-11));
  return `+55${full}`;
}

/**
 * Valida se parece um celular BR (11 dígitos, começa com 9 após DDD).
 */
export function isValidPhoneBR(value: string | null | undefined): boolean {
  const d = digitsOnly(value);
  if (d.length !== 10 && d.length !== 11) return false;
  if (d.length === 11 && d[2] !== '9') return false;
  return /^\d{2}9?\d{8}$/.test(d);
}
