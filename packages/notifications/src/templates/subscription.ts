/**
 * Builders de mensagem WhatsApp para assinaturas.
 */

export interface SubscriptionNotificationPayload {
  customerName: string;
  planName: string;
  frequency: string;
  totalAmount: number;
  addons?: string[];
  publicOrderUrl?: string;
}

export function buildWhatsAppSubscriptionMessage(payload: SubscriptionNotificationPayload): string {
  const total = payload.totalAmount.toFixed(2).replace('.', ',');
  const lines = [
    `Olá! Gostaria de confirmar minha assinatura:`,
    ``,
    `*Plano:* ${payload.planName}`,
    `*Frequência:* ${payload.frequency}`,
    `*Valor:* R$ ${total}/${payload.frequency.toLowerCase()}`,
  ];

  if (payload.addons && payload.addons.length > 0) {
    lines.push(`*Complementos:* ${payload.addons.join(', ')}`);
  }

  lines.push('');
  lines.push(`*Nome:* ${payload.customerName}`);
  lines.push('');
  lines.push('Aguardo confirmação. Obrigado!');

  return lines.join('\n');
}

export function buildWhatsAppOrderConfirmation(payload: {
  customerName: string;
  publicCode: string;
  totalAmount: number;
  items: string[];
  siteUrl?: string;
}): string {
  const total = payload.totalAmount.toFixed(2).replace('.', ',');
  const lines = [
    `Olá! Meu pedido *${payload.publicCode}* está aguardando aprovação.`,
    ``,
    `*Itens:*`,
    ...payload.items.map((item) => `  - ${item}`),
    ``,
    `*Total:* R$ ${total}`,
    `*Nome:* ${payload.customerName}`,
  ];

  if (payload.siteUrl) {
    lines.push('');
    lines.push(`Acompanhe: ${payload.siteUrl}/pedido/${encodeURIComponent(payload.publicCode)}`);
  }

  lines.push('');
  lines.push('Aguardo confirmação!');

  return lines.join('\n');
}
