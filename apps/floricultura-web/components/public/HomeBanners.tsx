import Link from 'next/link';
import Image from 'next/image';
import { getBanners } from '@/features/catalog/data';
import { Button } from '@flordoestudante/ui';
import { resolvePublicImageUrl } from '@/lib/image-url';

const hasValidImageUrl = (url: string) =>
  url.startsWith('http') || (url.startsWith('/') && url.length > 1);

export async function HomeBanners() {
  const banners = await getBanners();
  if (banners.length === 0) return null;

  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-emerald-50/40 to-background py-8 sm:py-12">
      <div className="container px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
          {banners.slice(0, 2).map((banner) => {
            const bannerSrc = resolvePublicImageUrl(banner.imageUrl);
            return (
              <div
                key={banner.id}
                className="relative overflow-hidden rounded-lg border border-border bg-muted/30"
              >
                <div className="relative aspect-[3/1] min-h-[120px] w-full sm:min-w-[300px]">
                  {hasValidImageUrl(bannerSrc) ? (
                    <Image
                      src={bannerSrc}
                      alt={banner.title}
                      fill
                      className="object-cover"
                      unoptimized={bannerSrc.startsWith('http')}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/30" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-center bg-black/20 p-4">
                    <h3 className="font-serif text-lg font-medium text-white drop-shadow">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-sm text-white/90 drop-shadow">{banner.subtitle}</p>
                    )}
                    {banner.ctaLabel && banner.ctaHref && (
                      <Button asChild size="sm" className="mt-2 w-fit">
                        <Link href={banner.ctaHref}>{banner.ctaLabel}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
