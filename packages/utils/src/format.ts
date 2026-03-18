/**
 * Formatação genérica (não específica de moeda/data/telefone).
 */

/**
 * Preenche à esquerda com caractere.
 */
export function padStart(value: string | number, length: number, char = '0'): string {
  return String(value).padStart(length, char);
}

/**
 * Máscara simples: substitui # por dígitos na ordem.
 */
export function mask(value: string, pattern: string, digitChar = '#'): string {
  const digits = value.replace(/\D/g, '');
  let i = 0;
  return pattern.replace(new RegExp(digitChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () =>
    digits[i++] ?? ''
  );
}

/**
 * Pluraliza palavra em português (regra simples: termina em s? mantém : adiciona s).
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? singular.replace(/([^s])$/, '$1s');
}
