import { AnimatedSection } from '../shared/AnimatedSection';

export function HomeIntro() {
  return (
    <section id="sobre" className="section-divider py-14 sm:py-20">
      <div className="container px-4">
        <AnimatedSection className="mx-auto max-w-xl text-center" delay={0.1}>
          <p className="editorial-label">Nossa essência</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl">
            Feito para momentos especiais
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Na Flor do Estudante você monta seu pedido com calma, escolhe entre retirada na loja ou
            entrega, e pode escrever uma mensagem no cartão. Tudo simples, seguro e feito com
            carinho.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
