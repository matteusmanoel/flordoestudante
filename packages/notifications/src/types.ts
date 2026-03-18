/**
 * Tipos de notificação (email, WhatsApp, payloads).
 */

export type NotificationChannel = 'email' | 'whatsapp';

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface WhatsAppPayload {
  to: string; // E.164
  message: string;
  template?: string;
  templateParams?: Record<string, string>;
}

export interface OrderNotificationPayload {
  orderId: string;
  publicCode: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  status: string;
  channel: NotificationChannel;
}
