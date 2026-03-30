import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { AnimatedSection } from '../shared/AnimatedSection';
import { BRAND_LOGO_SRC } from '@/lib/constants';

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-to-br from-green-50/90 via-emerald-50/70 to-background">
      <div className="container px-4 py-16 sm:py-24 md:py-32">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <div className="relative mx-auto min-h-[11rem] overflow-hidden px-2 sm:min-h-[13rem] md:min-h-[15rem]">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 z-0 h-[min(78vw,420px)] max-h-[28rem] w-[min(100%,560px)] max-w-[100%] -translate-x-1/2 opacity-[0.26] sm:h-[24rem] sm:w-[34rem] md:h-[28rem] md:w-[38rem]"
            >
              <Image
                src={BRAND_LOGO_SRC}
                alt=""
                fill
                className="object-contain object-bottom"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
            </div>
            <h1 className="relative z-10 pt-[clamp(4.5rem,18vw,9rem)] font-serif text-4xl font-medium tracking-tight text-foreground sm:pt-[clamp(5rem,16vw,9.5rem)] sm:text-5xl md:text-6xl">
              Flores e presentes com carinho
            </h1>
          </div>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Buquês, arranjos, cestas e assinaturas de flores para quem você ama.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="min-w-[140px]">
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[140px]">
              <Link href="/assinaturas">Assinar flores</Link>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
