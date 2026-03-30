import { getSubscriptionPlans } from '@/features/subscriptions/data';
import { SubscriptionPlanGrid } from '@/features/subscriptions/components/SubscriptionPlanGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assinaturas de Flores | Flor do Estudante',
  description: 'Receba flores frescas com frequência. Escolha o plano ideal para você.',
};

export default async function AssinaturasPage() {
  const plans = await getSubscriptionPlans();

  return (
    <div className="container max-w-5xl px-4 py-10 md:py-16">
      <header className="mb-10 text-center">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
          Assinaturas de Flores
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground leading-relaxed">
          Receba arranjos frescos na sua porta com a frequência que preferir. 
          Cada entrega é uma surpresa preparada com carinho pela nossa equipe.
        </p>
      </header>

      <SubscriptionPlanGrid plans={plans} />

      <section className="mt-16 rounded-xl border border-border/60 bg-muted/30 p-6 md:p-10">
        <h2 className="font-serif text-xl font-medium mb-4">Como funciona</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 text-2xl">1</div>
            <h3 className="font-medium">Escolha seu plano</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione a frequência ideal: semanal, quinzenal ou mensal.
            </p>
          </div>
          <div>
            <div className="mb-2 text-2xl">2</div>
            <h3 className="font-medium">Finalize rapidamente</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sem cadastro. Informe seus dados e pague online pelo Stripe.
            </p>
          </div>
          <div>
            <div className="mb-2 text-2xl">3</div>
            <h3 className="font-medium">Receba em casa</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Arranjos frescos entregues no dia combinado. Pause ou cancele quando quiser.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
