/**
 * Status oficiais de pagamento.
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  REFUNDED_MANUAL: 'refunded_manual',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pendente',
  [PAYMENT_STATUS.AUTHORIZED]: 'Autorizado',
  [PAYMENT_STATUS.PAID]: 'Pago',
  [PAYMENT_STATUS.EXPIRED]: 'Expirado',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelado',
  [PAYMENT_STATUS.FAILED]: 'Falhou',
  [PAYMENT_STATUS.REFUNDED_MANUAL]: 'Reembolsado (manual)',
};
