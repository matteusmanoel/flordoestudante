import Link from 'next/link';
import { Button } from '@flordoestudante/ui';

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/40 to-background">
      <div className="container px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Flores e presentes com carinho
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Buquês, arranjos e cestas para quem você ama. Entrega e retirada na loja.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[160px]">
              <Link href="/#sobre">Conhecer</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
