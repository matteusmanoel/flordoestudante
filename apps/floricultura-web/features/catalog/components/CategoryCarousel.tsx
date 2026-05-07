'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@flordoestudante/utils';
import { ProductCard } from './ProductCard';
import type { ProductCardModel } from '../types';

type CategoryCarouselProps = {
  products: ProductCardModel[];
  className?: string;
};

export function CategoryCarousel({ products, className }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  function scrollBy(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('li')?.offsetWidth ?? 240;
    el.scrollBy({ left: direction === 'left' ? -(cardWidth + 16) * 2 : (cardWidth + 16) * 2, behavior: 'smooth' });
  }

  if (products.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Prev button */}
      <button
        type="button"
        onClick={() => scrollBy('left')}
        aria-label="Anterior"
        className={cn(
          'absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all md:flex',
          'h-9 w-9 text-muted-foreground hover:text-foreground hover:shadow-lg',
          canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Scroll container */}
      <ul
        ref={scrollRef}
        className="scrollbar-none flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[min(75vw,210px)] shrink-0 snap-start sm:w-[200px] lg:w-[220px]"
          >
            <ProductCard product={product} className="h-full" />
          </li>
        ))}
      </ul>

      {/* Next button */}
      <button
        type="button"
        onClick={() => scrollBy('right')}
        aria-label="Próximo"
        className={cn(
          'absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all md:flex',
          'h-9 w-9 text-muted-foreground hover:text-foreground hover:shadow-lg',
          canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
