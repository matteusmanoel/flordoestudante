/**
 * Utilitários de busca (normalização de texto para filtro/listagem).
 */

/**
 * Normaliza texto para comparação: minúsculo, sem acentos, trim.
 */
export function normalizeForSearch(text: string | null | undefined): string {
  if (text == null) return '';
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica se o texto de busca está contido no alvo (após normalização).
 */
export function searchMatches(search: string | null | undefined, target: string | null | undefined): boolean {
  const s = normalizeForSearch(search);
  const t = normalizeForSearch(target);
  if (s === '') return true;
  return t.includes(s);
}
