/**
 * Utilitários de objeto/array (apenas os claramente úteis).
 */

/**
 * Acesso seguro a propriedade aninhada.
 */
export function get<T>(obj: unknown, path: string): T | undefined {
  if (obj == null) return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current as T;
}

/**
 * Remove duplicatas por chave.
 */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Agrupa array por chave.
 */
export function groupBy<T>(arr: T[], keyFn: (item: T) => string | number): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = String(keyFn(item));
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}
