'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@flordoestudante/utils';
import { resolvePublicImageUrl } from '@/lib/image-url';
import type { BannerViewModel } from '@/features/catalog/types';

const INTERVAL_MS = 4500;

const hasValidImageUrl = (url: string) =>
  url.startsWith('http') || (url.startsWith('/') && url.length > 1);

type Props = {
  banners: BannerViewModel[];
};

export function HomeBannersCarousel({ banners }: Props) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, isPaused, banners.length]);

  if (banners.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => {
          const src = resolvePublicImageUrl(banner.imageUrl);
          const Wrapper = ({ children }: { children: React.ReactNode }) => (
            <Link href="/catalogo" className="block">
              {children}
            </Link>
          );

          return (
            <div key={banner.id} className="relative min-w-full">
              <Wrapper>
                <div className="relative aspect-[16/7] w-full">
                  {hasValidImageUrl(src) ? (
                    <Image
                      src={src}
                      alt={banner.title}
                      fill
                      className="object-cover"
                      unoptimized={src.startsWith('http')}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-floral-gradient" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Texto */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                    <h3 className="font-display text-xl font-medium text-white drop-shadow sm:text-2xl">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="mt-1 text-sm text-white/85 drop-shadow">{banner.subtitle}</p>
                    )}
                    {banner.ctaLabel && (
                      <span className="mt-3 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                        {banner.ctaLabel} →
                      </span>
                    )}
                  </div>
                </div>
              </Wrapper>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              )}
            />
          ))}
        </div>
      )}

      {/* Prev / Next (visível apenas no hover em desktop) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:bg-black/50 group-hover:opacity-100 focus:opacity-100 sm:opacity-0 [.group:hover_&]:opacity-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:bg-black/50 [.group:hover_&]:opacity-100 focus:opacity-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
