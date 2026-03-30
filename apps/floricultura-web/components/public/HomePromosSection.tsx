import { getPromoProducts } from '@/features/catalog/data';
import { PromoProductsSection } from '@/features/catalog/components';

export async function HomePromosSection() {
  const promos = await getPromoProducts(6);
  if (promos.length === 0) return null;

  return (
    <section
      id="promocoes"
      className="border-b border-border/60 bg-gradient-to-b from-rose-50/40 via-background to-transparent py-14 sm:py-20"
    >
      <div className="container px-4">
        <PromoProductsSection
          products={promos}
          title="Promoções"
          description="Seleção especial com desconto — aproveite enquanto durar o estoque."
          showCatalogLink
        />
      </div>
    </section>
  );
}
