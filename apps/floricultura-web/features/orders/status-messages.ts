import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from '@flordoestudante/core';

export interface StatusMessage {
  label: string;
  description: string;
}

export function getOrderStatusMessage(status: string): StatusMessage {
  const s = status as OrderStatus;
  const label = ORDER_STATUS_LABELS[s] ?? status;

  switch (s) {
    case ORDER_STATUS.PENDING_PAYMENT:
      return {
        label,
        description:
          'Estamos aguardando o pagamento para que o pedido siga para aprovação pela loja.',
      };
    case ORDER_STATUS.AWAITING_APPROVAL:
      return {
        label,
        description:
          'Seu pedido foi recebido e está aguardando aprovação manual pela Flor do Estudante.',
      };
    case ORDER_STATUS.APPROVED:
      return {
        label,
        description:
          'Seu pedido foi aprovado pela loja e seguirá para preparação conforme combinado.',
      };
    case ORDER_STATUS.IN_PRODUCTION:
      return {
        label,
        description:
          'Seu pedido está em preparação. Em breve ele estará pronto para entrega ou retirada.',
      };
    case ORDER_STATUS.READY_FOR_PICKUP:
      return {
        label,
        description:
          'Seu pedido está pronto para retirada. Apresente o código do pedido na loja.',
      };
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return {
        label,
        description: 'Seu pedido saiu para entrega. Fique atento ao contato da loja.',
      };
    case ORDER_STATUS.COMPLETED:
      return {
        label,
        description: 'Pedido concluído. Obrigado por escolher a Flor do Estudante.',
      };
    case ORDER_STATUS.CANCELLED:
      return {
        label,
        description:
          'Este pedido foi cancelado. Em caso de dúvida, fale com a loja informando o código.',
      };
    case ORDER_STATUS.EXPIRED:
      return {
        label,
        description:
          'O prazo deste pedido expirou. Entre em contato com a loja para criar um novo pedido, se desejar.',
      };
    case ORDER_STATUS.DRAFT:
    default:
      return {
        label,
        description:
          'O pedido ainda está em rascunho ou em etapa inicial. Se tiver dúvidas, entre em contato com a loja.',
      };
  }
}

export function getPaymentStatusMessage(status: string): StatusMessage {
  const s = status as PaymentStatus;
  const label = PAYMENT_STATUS_LABELS[s] ?? status;

  switch (s) {
    case PAYMENT_STATUS.PAID:
      return {
        label,
        description:
          'Pagamento confirmado. Seu pedido segue para aprovação e preparação pela loja.',
      };
    case PAYMENT_STATUS.PENDING:
      return {
        label,
        description:
          'Pagamento ainda pendente. Conclua o pagamento ou entre em contato com a loja em caso de dúvida.',
      };
    case PAYMENT_STATUS.EXPIRED:
      return {
        label,
        description:
          'O prazo para pagamento deste pedido encerrou. Consulte a loja para combinar um novo pedido.',
      };
    case PAYMENT_STATUS.CANCELLED:
      return {
        label,
        description:
          'O pagamento foi cancelado. Se não reconhece esta ação, entre em contato com a loja.',
      };
    case PAYMENT_STATUS.FAILED:
      return {
        label,
        description:
          'O pagamento não foi concluído. Tente novamente ou ajuste a forma de pagamento com a loja.',
      };
    case PAYMENT_STATUS.AUTHORIZED:
      return {
        label,
        description:
          'Pagamento autorizado pelo provedor. A loja concluirá o processamento em breve.',
      };
    case PAYMENT_STATUS.REFUNDED_MANUAL:
      return {
        label,
        description:
          'Este pagamento foi ajustado manualmente pela loja. Em caso de dúvida, fale com o atendimento.',
      };
    default:
      return {
        label,
        description: 'Status de pagamento em atualização. Em breve será refletido aqui.',
      };
  }
}

