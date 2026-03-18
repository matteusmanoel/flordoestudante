/**
 * Status oficiais de pedido (máquina de estados).
 */
export const ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  AWAITING_APPROVAL: 'awaiting_approval',
  APPROVED: 'approved',
  IN_PRODUCTION: 'in_production',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.DRAFT]: 'Rascunho',
  [ORDER_STATUS.PENDING_PAYMENT]: 'Aguardando pagamento',
  [ORDER_STATUS.PAID]: 'Pago',
  [ORDER_STATUS.AWAITING_APPROVAL]: 'Aguardando aprovação',
  [ORDER_STATUS.APPROVED]: 'Aprovado',
  [ORDER_STATUS.IN_PRODUCTION]: 'Em produção',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Pronto para retirada',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Saiu para entrega',
  [ORDER_STATUS.COMPLETED]: 'Concluído',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
  [ORDER_STATUS.EXPIRED]: 'Expirado',
};
