import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
import { getBanners } from '@/features/catalog/data';
import { resolvePublicImageUrl } from '@/lib/image-url';
import { HeartPlus } from 'lucide-react';

export async function HomeHero() {
  const banners = await getBanners();
  const heroBanner = banners[0];
  const heroImageSrc = heroBanner?.imageUrl ? resolvePublicImageUrl(heroBanner.imageUrl) : null;
  const hasHeroImage =
    heroImageSrc &&
    (heroImageSrc.startsWith('http') || (heroImageSrc.startsWith('/') && heroImageSrc.length > 1));

  return (
    <section className="section-divider relative isolate overflow-hidden">
      <div className="grid min-h-[min(88dvh,540px)] lg:min-h-[520px] lg:grid-cols-[3fr_2fr]">
        {/* Coluna esquerda — imagem editorial */}
        <div className="relative min-h-[min(68dvh,400px)] bg-muted/30 sm:min-h-[420px] lg:min-h-[520px]">
          {hasHeroImage ? (
            <Image
              src={heroImageSrc!}
              alt={heroBanner?.title ?? 'Flor do Estudante'}
              fill
              className="object-cover object-[center_38%] sm:object-[center_28%] lg:object-center"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              unoptimized={heroImageSrc!.startsWith('http')}
            />
          ) : (
            <div className="absolute inset-0 bg-floral-gradient">
              {/* SVG pattern botânico decorativo */}
              <svg
                className="absolute inset-0 h-full w-full opacity-10"
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="floral-pattern"
                    x="0"
                    y="0"
                    width="80"
                    height="80"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="40" cy="40" r="3" fill="currentColor" className="text-primary" />
                    <circle
                      cx="10"
                      cy="10"
                      r="1.5"
                      fill="currentColor"
                      className="text-accent-foreground"
                    />
                    <circle
                      cx="70"
                      cy="10"
                      r="1.5"
                      fill="currentColor"
                      className="text-accent-foreground"
                    />
                    <circle
                      cx="10"
                      cy="70"
                      r="1.5"
                      fill="currentColor"
                      className="text-accent-foreground"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r="1.5"
                      fill="currentColor"
                      className="text-accent-foreground"
                    />
                    <line
                      x1="40"
                      y1="30"
                      x2="40"
                      y2="50"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-primary/50"
                    />
                    <line
                      x1="30"
                      y1="40"
                      x2="50"
                      y2="40"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-primary/50"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#floral-pattern)" />
              </svg>
            </div>
          )}
          {/* Mobile: duas camadas de gradiente (válidas no Tailwind) = base bem escura só onde está o texto. */}
          <div className="absolute inset-0 flex flex-col justify-end lg:hidden">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(72dvh,430px)] bg-gradient-to-t from-black via-black/55 to-transparent sm:h-[min(66dvh,400px)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/92 to-transparent sm:h-52"
              aria-hidden
            />
            <div className="relative z-10 mx-auto w-full max-w-[19.5rem] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 sm:max-w-md">
              <HeroText compact />
            </div>
          </div>
        </div>

        {/* Coluna direita — texto editorial (apenas desktop) */}
        <div className="hidden items-center bg-background px-8 py-12 lg:flex xl:px-12">
          <HeroText />
        </div>
      </div>
    </section>
  );
}

function HeroText({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'text-center' : 'max-w-sm'}>
      {compact ? (
        <p className="mx-auto w-max max-w-full">
          <span className="inline-block rounded-md bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white ring-1 ring-white/20 sm:text-[11px] sm:tracking-[0.18em]">
            Dia das Mães 2026
          </span>
        </p>
      ) : (
        <p className="editorial-label">Dia das Mães 2026</p>
      )}
      <h1
        className={cn(
          'font-display font-medium tracking-tight',
          compact
            ? 'mt-3.5 text-balance text-[1.3125rem] leading-snug text-white sm:text-2xl [text-shadow:0_0_1px_rgba(0,0,0,1),0_2px_16px_rgba(0,0,0,0.85),0_4px_32px_rgba(0,0,0,0.55)]'
            : 'mt-2 text-3xl text-foreground xl:text-4xl'
        )}
      >
        Flores que{' '}
        <span className={compact ? 'text-emerald-100' : 'text-primary'}>abraçam por você</span> neste
        Dia das Mães
      </h1>
      <p
        className={cn(
          compact
            ? 'mt-3.5 text-pretty text-[0.8125rem] font-medium leading-relaxed text-white sm:text-sm [text-shadow:0_0_1px_rgba(0,0,0,0.9),0_2px_12px_rgba(0,0,0,0.75)]'
            : 'mt-3 text-muted-foreground'
        )}
      >
        Entrega cuidadosa, mensagem personalizada no cartão e muita facilidade para presentear quem
        você mais ama.
      </p>
      <div className={cn('flex flex-wrap gap-3', compact ? 'mt-8 justify-center' : 'mt-6')}>
        <Button
          asChild
          size={compact ? 'default' : 'lg'}
          className={cn(
            'group rounded-full bg-primary px-5 transition-all hover:bg-primary/90',
            compact
              ? 'h-11 min-h-11 w-full text-sm font-medium shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] sm:h-12 sm:min-h-12 sm:text-base'
              : 'px-6'
          )}
        >
          <Link href="/catalogo" className="inline-flex items-center justify-center gap-2">
            <HeartPlus
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
              aria-hidden
            />
            Presentear com amor
          </Link>
        </Button>
      </div>
    </div>
  );
}
