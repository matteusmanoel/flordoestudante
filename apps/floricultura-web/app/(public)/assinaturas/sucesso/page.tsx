import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { STORE_WHATSAPP } from '@/lib/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assinatura confirmada | Flor do Estudante',
};

export default function SubscriptionSuccessPage() {
  const whatsMessage = [
    'Olá! Acabei de assinar um plano de flores pela Flor do Estudante.',
    'Gostaria de confirmar os detalhes da minha primeira entrega.',
  ].join('\n');

  return (
    <div className="container max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-serif text-2xl font-medium mb-3">Assinatura confirmada!</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Sua assinatura de flores foi criada com sucesso. Entre em contato via WhatsApp
        para confirmar os detalhes da sua primeira entrega.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <WhatsAppCTA
          phone={STORE_WHATSAPP}
          message={whatsMessage}
          label="Confirmar no WhatsApp"
          size="lg"
        />
        <Button asChild variant="outline" size="lg">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
