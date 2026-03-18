/**
 * Builders de mensagem para pedido (texto/HTML).
 */

import type { OrderNotificationPayload } from '../types';

export function buildOrderConfirmationSubject(payload: OrderNotificationPayload): string {
  return `Pedido ${payload.publicCode} recebido`;
}

export function buildOrderConfirmationText(payload: OrderNotificationPayload): string {
  return [
    `Olá, ${payload.customerName}!`,
    ``,
    `Seu pedido ${payload.publicCode} foi recebido.`,
    `Total: R$ ${payload.totalAmount.toFixed(2).replace('.', ',')}`,
    ``,
    `Acompanhe o status pelo link ou entre em contato conosco.`,
  ].join('\n');
}

export function buildWhatsAppOrderMessage(payload: OrderNotificationPayload): string {
  const total = payload.totalAmount.toFixed(2).replace('.', ',');
  return [
    `Olá, ${payload.customerName}!`,
    `Pedido *${payload.publicCode}* recebido. Total: R$ ${total}.`,
    `Em breve entraremos em contato.`,
  ].join('\n');
}
