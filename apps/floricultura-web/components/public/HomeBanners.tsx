import { getBanners } from '@/features/catalog/data';
import { HomeBannersCarousel } from './HomeBannersCarousel';

export async function HomeBanners() {
  const banners = await getBanners();
  if (banners.length === 0) return null;

  return (
    <section className="section-divider py-8 sm:py-12">
      <HomeBannersCarousel banners={banners} />
    </section>
  );
}
