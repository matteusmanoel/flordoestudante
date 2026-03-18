/**
 * Merge de classes (Tailwind / CSS) com suporte a condicionais.
 * Usa clsx + tailwind-merge para evitar conflitos de classes Tailwind.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes de forma segura para Tailwind.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
