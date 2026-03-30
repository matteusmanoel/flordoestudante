import { HomeHero } from '@/components/public/HomeHero';
import { HomeBanners } from '@/components/public/HomeBanners';
import { HomeIntro } from '@/components/public/HomeIntro';
import { HomePromosSection } from '@/components/public/HomePromosSection';
import { HomeCatalogSection } from '@/components/public/HomeCatalogSection';
import { HomeSubscriptions } from '@/components/public/HomeSubscriptions';

export default function PublicHomePage() {
  return (
    <>
      <HomeHero />
      <HomeBanners />
      <HomeIntro />
      <HomePromosSection />
      <HomeCatalogSection />
      <HomeSubscriptions />
    </>
  );
}
