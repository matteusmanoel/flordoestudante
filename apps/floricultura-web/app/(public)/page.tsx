import { HomeHero } from '@/components/public/HomeHero';
import { HomeBanners } from '@/components/public/HomeBanners';
import { HomeIntro } from '@/components/public/HomeIntro';
import { HomeCatalogSection } from '@/components/public/HomeCatalogSection';

export default function PublicHomePage() {
  return (
    <>
      <HomeHero />
      <HomeBanners />
      <HomeIntro />
      <HomeCatalogSection />
    </>
  );
}
