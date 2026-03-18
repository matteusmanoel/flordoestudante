/**
 * Helpers WhatsApp (payload e URL).
 */
import type { WhatsAppPayload } from '../types';

export function getWhatsAppUrl(phone: string, message?: string): string {
  const normalized = phone.replace(/\D/g, '');
  const num = normalized.startsWith('55') ? normalized : `55${normalized}`;
  const base = `https://wa.me/${num}`;
  if (message && message.trim()) {
    return `${base}?text=${encodeURIComponent(message.trim())}`;
  }
  return base;
}

export function buildWhatsAppPayload(to: string, message: string): WhatsAppPayload {
  return { to, message };
}
