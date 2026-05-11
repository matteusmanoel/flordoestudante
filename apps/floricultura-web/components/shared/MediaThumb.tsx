'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@flordoestudante/utils';
import { isPlaceholderMediaUrl } from '@/lib/constants';
import { resolvePublicImageUrl } from '@/lib/image-url';

export type MediaThumbProps = {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  placeholderIconClassName?: string;
  /** Enquanto a imagem carrega, mostra bloco pulsante (evita “pulo” de layout). */
  showLoadingSkeleton?: boolean;
};

function PlaceholderBlock({
  fill,
  width,
  height,
  className,
  placeholderIconClassName,
  alt,
}: Pick<MediaThumbProps, 'fill' | 'width' | 'height' | 'className' | 'placeholderIconClassName' | 'alt'>) {
  if (fill) {
    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-muted/60',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Package
          className={cn('h-7 w-7 text-muted-foreground/35', placeholderIconClassName)}
          aria-hidden
        />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden bg-muted/60',
        className
      )}
      style={width != null && height != null ? { width, height } : undefined}
      role="img"
      aria-label={alt}
    >
      <Package
        className={cn('h-7 w-7 text-muted-foreground/35', placeholderIconClassName)}
        aria-hidden
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}

export function MediaThumb({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  imageClassName,
  priority,
  placeholderIconClassName,
  showLoadingSkeleton = false,
}: MediaThumbProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setLoadFailed(false);
    setImageLoaded(false);
  }, [src]);
  const url = resolvePublicImageUrl(src);
  const showPlaceholder = loadFailed || isPlaceholderMediaUrl(url);

  if (showPlaceholder) {
    return (
      <PlaceholderBlock
        fill={fill}
        width={width}
        height={height}
        className={className}
        placeholderIconClassName={placeholderIconClassName}
        alt={alt}
      />
    );
  }

  const isExternal = url.startsWith('http');

  if (fill) {
    const showSkeletonOverlay =
      showLoadingSkeleton && !showPlaceholder && !imageLoaded && !loadFailed;
    return (
      <span className={cn('relative block h-full w-full', className)}>
        {showSkeletonOverlay ? (
          <span className="absolute inset-0 z-[1] animate-pulse bg-muted" aria-hidden />
        ) : null}
        <Image
          src={url}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-opacity duration-200',
            showLoadingSkeleton && !imageLoaded && 'opacity-0',
            imageClassName
          )}
          sizes={sizes}
          priority={priority}
          unoptimized={isExternal}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setLoadFailed(true);
            setImageLoaded(true);
          }}
        />
      </span>
    );
  }

  if (width != null && height != null) {
    return (
      <Image
        src={url}
        alt={alt}
        width={width}
        height={height}
        className={cn('object-cover', imageClassName)}
        sizes={sizes}
        unoptimized={isExternal}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  throw new Error('MediaThumb requires fill or both width and height');
}
