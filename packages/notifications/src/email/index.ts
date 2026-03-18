/**
 * Helpers email (payload básico).
 */
import type { EmailPayload } from '../types';

export function buildEmailPayload(
  to: string,
  subject: string,
  text: string,
  options?: { from?: string; html?: string }
): EmailPayload {
  return {
    to,
    subject,
    text,
    html: options?.html,
    from: options?.from,
  };
}
