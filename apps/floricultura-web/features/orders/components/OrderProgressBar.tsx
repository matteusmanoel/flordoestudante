'use client';

import { cn } from '@flordoestudante/utils';
import { ORDER_STATUS } from '@flordoestudante/core';

// Etapas do progresso do pedido
const PROGRESS_STEPS = [
  { key: 'awaiting_approval', label: 'Aguardando aprovação' },
  { key: 'approved', label: 'Pedido aprovado' },
  { key: 'in_production', label: 'Sendo preparado' },
  { key: 'ready_or_out', label: 'Pronto / Saiu para entrega' },
  { key: 'completed', label: 'Concluído' },
] as const;

type Props = {
  status: string;
  fulfillmentType: 'delivery' | 'pickup';
};

function getStepIndex(status: string, fulfillmentType: 'delivery' | 'pickup'): number {
  // Mapeia o status para índice de progresso
  switch (status) {
    case ORDER_STATUS.DRAFT:
    case ORDER_STATUS.PENDING_PAYMENT:
    case ORDER_STATUS.AWAITING_APPROVAL:
    case ORDER_STATUS.PAID:
      return 0;
    case ORDER_STATUS.APPROVED:
      return 1;
    case ORDER_STATUS.IN_PRODUCTION:
      return 2;
    case ORDER_STATUS.READY_FOR_PICKUP:
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return 3;
    case ORDER_STATUS.COMPLETED:
      return 4;
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.EXPIRED:
      return -1; // Não mostrar progresso
    default:
      return 0;
  }
}

export function OrderProgressBar({ status, fulfillmentType }: Props) {
  const currentStep = getStepIndex(status, fulfillmentType);

  if (currentStep < 0) {
    return null; // Não mostrar barra para pedidos cancelados/expirados
  }

  // Ajustar label da última etapa com base no tipo de entrega
  const steps = PROGRESS_STEPS.map((step, idx) => {
    if (idx === 3) {
      return {
        ...step,
        label: fulfillmentType === 'delivery' ? 'Saiu para entrega' : 'Pronto para retirada',
      };
    }
    return step;
  });

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h3 className="mb-4 font-display text-base font-medium text-foreground">
        Acompanhe seu pedido
      </h3>

      {/* Barra horizontal de progresso */}
      <div className="relative">
        {/* Linha de fundo */}
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-border" />

        {/* Linha de progresso preenchido */}
        <div
          className="absolute left-0 top-3 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isFuture = idx > currentStep;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center"
                style={{ flex: 1 }}
              >
                {/* Círculo do step */}
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent &&
                      'animate-pulse border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40',
                    isFuture && 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-medium">{idx + 1}</span>
                  )}
                </div>

                {/* Label do step */}
                <p
                  className={cn(
                    'mt-2 text-center text-[10px] font-medium leading-tight transition-colors sm:text-xs',
                    (isCurrent || isCompleted) && 'text-foreground',
                    isFuture && 'text-muted-foreground'
                  )}
                  style={{ maxWidth: '80px' }}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
