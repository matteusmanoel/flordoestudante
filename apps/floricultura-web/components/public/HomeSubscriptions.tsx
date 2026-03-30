import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { getSubscriptionPlans } from '@/features/subscriptions/data';
import { SubscriptionPlanGrid } from '@/features/subscriptions/components/SubscriptionPlanGrid';

export async function HomeSubscriptions() {
  const plans = await getSubscriptionPlans();
  if (plans.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-green-50/50 via-emerald-50/30 to-background py-12 md:py-16">
      <div className="container max-w-5xl px-4">
      <header className="mb-8 text-center">
        <h2 className="font-serif text-2xl font-medium md:text-3xl">
          Flores por Assinatura
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
          Receba arranjos frescos na frequência ideal. Sem compromisso, cancele quando quiser.
        </p>
      </header>
      <SubscriptionPlanGrid plans={plans} />
        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/assinaturas">Ver todos os planos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
