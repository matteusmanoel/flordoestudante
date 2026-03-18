/**
 * Contratos para envio de notificação (implementação no app).
 */

import type { EmailPayload, WhatsAppPayload } from './types';

export interface EmailSender {
  send(payload: EmailPayload): Promise<{ success: boolean; error?: string }>;
}

export interface WhatsAppSender {
  send(payload: WhatsAppPayload): Promise<{ success: boolean; error?: string }>;
}

export interface NotificationConfig {
  email?: EmailSender;
  whatsapp?: WhatsAppSender;
  defaultFromEmail?: string;
  defaultPhone?: string;
}
