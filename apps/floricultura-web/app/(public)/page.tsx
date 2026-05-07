import { HomeHero } from '@/components/public/HomeHero';
import { HomeTrustBar } from '@/components/public/HomeTrustBar';
import { HomeBanners } from '@/components/public/HomeBanners';
import { HomeOccasionTiles } from '@/components/public/HomeOccasionTiles';
import { HomePromosSection } from '@/components/public/HomePromosSection';
import { HomeCatalogSection } from '@/components/public/HomeCatalogSection';
import { HomeSubscriptions } from '@/components/public/HomeSubscriptions';

export default function PublicHomePage() {
  return (
    <>
      <HomeHero />
      <HomeTrustBar />
      <HomeOccasionTiles />
      <HomePromosSection />
      <HomeCatalogSection />
      <HomeBanners />
      <HomeSubscriptions />
    </>
  );
}
